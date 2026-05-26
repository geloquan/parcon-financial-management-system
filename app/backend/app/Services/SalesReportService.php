<?php

namespace App\Services;

use App\Models\Business;
use App\Models\BusinessReferenceItem;
use App\Models\CapitalMovement;
use App\Models\CoffeeSale;
use App\Models\CompensationRun;
use App\Models\EtherealSale;
use App\Models\Expense;
use App\Models\GcashSale;
use App\Models\PrintSale;
use App\Models\SalesReportVersion;
use App\Models\Staff;
use App\Models\StaffAbsence;
use App\Models\StaffDayOff;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelPdf\Facades\Pdf;

class SalesReportService
{
  private const INCLUDE_SECTIONS = [
    'staff',
    'schedule_attendance',
    'compensation',
    'reference_items',
    'expenses',
    'sales_gcash',
    'sales_coffee',
    'sales_print',
    'sales_ethereal',
    'portfolio_business_money',
  ];

  private const SALES_INCLUDE_SECTIONS = [
    'sales_gcash',
    'sales_coffee',
    'sales_print',
    'sales_ethereal',
  ];

  public function paginate(Business $business): LengthAwarePaginator
  {
    $reportScope = request()->query('report_scope');

    $paginator = SalesReportVersion::query()
      ->where('business_id', $business->id)
      ->when(
        in_array($reportScope, ['business', 'all_businesses'], true),
        fn(Builder $query) => $query->where('metadata->report_scope', $reportScope)
      )
      ->latest('id')
      ->paginate(10);

    $paginator->getCollection()->transform(function (SalesReportVersion $report): SalesReportVersion {
      return $this->attachPdfVerification($report);
    });

    return $paginator;
  }

  public function paginatePortfolio(): LengthAwarePaginator
  {
    $paginator = SalesReportVersion::query()
      ->where('metadata->report_scope', 'all_businesses')
      ->latest('id')
      ->paginate(10);

    $paginator->getCollection()->transform(function (SalesReportVersion $report): SalesReportVersion {
      return $this->attachPdfVerification($report);
    });

    return $paginator;
  }

  public function generate(array $validated): array
  {
    [$startAt, $endAt] = $this->resolvePeriod($validated);
    $businessId = $validated['scope'] === 'business' ? (int)$validated['business_id'] : null;
    $businessName = $businessId ? Business::query()->whereKey($businessId)->value('name') : null;

    $gcashQuery = GcashSale::query();
    $coffeeQuery = CoffeeSale::query();
    $printQuery = PrintSale::query();
    $etherealQuery = EtherealSale::query();

    if ($businessId) {
      $gcashQuery->where('business_id', $businessId);
      $coffeeQuery->where('business_id', $businessId);
      $printQuery->where('business_id', $businessId);
      $etherealQuery->where('business_id', $businessId);
    }

    $this->applyDateRange($gcashQuery, 'transaction_date', $startAt, $endAt);
    $this->applyDateRange($coffeeQuery, 'sale_date', $startAt, $endAt);
    $this->applyDateRange($printQuery, 'sale_date', $startAt, $endAt);
    $this->applyDateRange($etherealQuery, 'service_date', $startAt, $endAt);

    $gcashTotal = (float)(clone $gcashQuery)->sum('sales_amount');
    $coffeeTotal = (float)((clone $coffeeQuery)->selectRaw('COALESCE(SUM(price + add_on_price), 0) as total_amount')->value('total_amount') ?? 0);
    $printTotal = (float)(clone $printQuery)->sum('sales_amount');
    $etherealTotal = (float)(clone $etherealQuery)->sum('net_amount');
    $salesTotal = $gcashTotal + $coffeeTotal + $printTotal + $etherealTotal;
    $transactionCount = (int)(clone $gcashQuery)->count()
      + (int)(clone $coffeeQuery)->count()
      + (int)(clone $printQuery)->count()
      + (int)(clone $etherealQuery)->count();

    return [
      'scope' => $validated['scope'],
      'period' => $validated['period'],
      'business_id' => $businessId,
      'business_name' => $businessName,
      'start_date' => $startAt->toDateString(),
      'end_date' => $endAt->toDateString(),
      'generated_at' => now()->toIso8601String(),
      'totals' => [
        'gcash_sales_total' => $this->toMoneyString($gcashTotal),
        'coffee_sales_total' => $this->toMoneyString($coffeeTotal),
        'print_sales_total' => $this->toMoneyString($printTotal),
        'ethereal_sales_total' => $this->toMoneyString($etherealTotal),
        'sales_total' => $this->toMoneyString($salesTotal),
        'total_transactions' => $transactionCount,
      ],
    ];
  }

  public function store(Business $business, User $user, array $validated): SalesReportVersion
  {
    $startDate = Carbon::parse($validated['start_date'])->startOfDay();
    $endDate = Carbon::parse($validated['end_date'])->endOfDay();
    $reportType = (string)($validated['report_type'] ?? 'sales');
    $reportScope = (string)($validated['report_scope'] ?? 'business');
    $includeSections = $this->resolveIncludeSections($validated['include_sections'] ?? null);
    $documentTitle = $this->buildDocumentTitle($business, $reportType, $reportScope, $includeSections);

    $nextVersion = (int)SalesReportVersion::query()
        ->where('business_id', $business->id)
        ->max('version') + 1;

    $details = $this->collectDetails($business, $startDate, $endDate, $reportType, $reportScope, $includeSections);
    $now = now();

    $report = SalesReportVersion::query()->create([
      'business_id' => $business->id,
      'generated_by_user_id' => $user->id,
      'version' => $nextVersion,
      'start_date' => $startDate->toDateString(),
      'end_date' => $endDate->toDateString(),
      'document_title' => $documentTitle,
      'document_format' => 'pdf-8.5x13',
      'report_type' => $reportType,
      'metadata' => [
        'page_size' => '8.5x13in',
        'generated_at' => $now->toIso8601String(),
        'generated_by' => $user->name,
        'generated_by_username' => $user->username,
        'business_name' => $business->name,
        'business_slug' => $business->slug,
        'report_scope' => $reportScope,
        'report_type' => $reportType,
        'include_sections' => $includeSections,
        'stored_disk' => 'local',
      ],
      'details' => $details,
    ]);

    $pdf = $this->generatePdf($report);
    $filePath = sprintf(
      'sales-reports/%s/%s-%s-v%s-%s.pdf',
      $business->slug,
      $reportType,
      $this->slugify($report->document_title),
      $report->version,
      $report->id
    );

    Storage::disk('local')->put($filePath, $pdf);

    $report->update([
      'file_path' => $filePath,
      'file_size_bytes' => strlen($pdf),
      'metadata' => [
        ...($report->metadata ?? []),
        'stored_file_name' => basename($filePath),
      ],
    ]);

    return $this->attachPdfVerification($report->refresh());
  }

  public function download(Business $business, SalesReportVersion $report): array
  {
    $filename = $this->resolveDownloadFilename($report, $business);

    if ($report->file_path && Storage::disk('local')->exists($report->file_path)) {
      return [
        'filename' => $filename,
        'content' => Storage::disk('local')->get($report->file_path),
      ];
    }

    return [
      'filename' => $filename,
      'content' => $this->generatePdf($report),
    ];
  }

  public function downloadPortfolio(SalesReportVersion $report): array
  {
    $filename = $this->resolveDownloadFilename($report);

    if ($report->file_path && Storage::disk('local')->exists($report->file_path)) {
      return [
        'filename' => $filename,
        'content' => Storage::disk('local')->get($report->file_path),
      ];
    }

    return [
      'filename' => $filename,
      'content' => $this->generatePdf($report),
    ];
  }

  private function resolvePeriod(array $validated): array
  {
    if ($validated['period'] === 'today') {
      return [now()->startOfDay(), now()->endOfDay()];
    }

    return [
      Carbon::parse((string)$validated['start_date'])->startOfDay(),
      Carbon::parse((string)$validated['end_date'])->endOfDay(),
    ];
  }

  private function applyDateRange(Builder $query, string $column, Carbon $startAt, Carbon $endAt): void
  {
    $query->whereBetween($column, [$startAt, $endAt]);
  }

  private function collectDetails(Business $business, Carbon $startDate, Carbon $endDate, string $reportType, string $reportScope, array $includeSections): array
  {
    $salesSectionsToInclude = array_values(array_intersect(self::SALES_INCLUDE_SECTIONS, $includeSections));
    $includeSales = in_array($reportType, ['sales', 'combined'], true) && count($salesSectionsToInclude) > 0;
    $includeCompensation = in_array($reportType, ['compensation', 'combined'], true)
      && in_array('compensation', $includeSections, true);
    $isAllBusinesses = $reportScope === 'all_businesses';
    $targetBusiness = $isAllBusinesses ? null : $business;

    $salesDetails = $includeSales
      ? $this->collectSalesDetails($targetBusiness, $startDate, $endDate, $salesSectionsToInclude)
      : [
        'totals' => [
          'gcash_sales' => 0.0,
          'gcash_profit' => 0.0,
          'coffee_sales' => 0.0,
          'coffee_profit' => 0.0,
          'print_sales' => 0.0,
          'print_profit' => 0.0,
          'ethereal_sales' => 0.0,
          'ethereal_profit' => 0.0,
          'overall_sales' => 0.0,
          'overall_profit' => 0.0,
        ],
        'counts' => [
          'gcash_entries' => 0,
          'coffee_entries' => 0,
          'print_entries' => 0,
          'ethereal_entries' => 0,
          'all_entries' => 0,
        ],
        'business_summary' => [],
        'entries' => [],
      ];

    // Aggregate overall_profit from all module profits.
    // collectSalesDetails is expected to populate the *_profit keys per module;
    // any missing key safely defaults to 0.
    $salesDetails['totals']['overall_profit'] =
      ($salesDetails['totals']['gcash_profit'] ?? 0.0) +
      ($salesDetails['totals']['coffee_profit'] ?? 0.0) +
      ($salesDetails['totals']['print_profit'] ?? 0.0) +
      ($salesDetails['totals']['ethereal_profit'] ?? 0.0);

    // Carry a total_profit into each business_summary row, derived from
    // per-module profit keys that collectSalesDetails should populate.
    $salesDetails['business_summary'] = array_map(
      static function (array $summary): array {
        $summary['total_profit'] =
          ($summary['gcash_profit'] ?? 0.0) +
          ($summary['coffee_profit'] ?? 0.0) +
          ($summary['print_profit'] ?? 0.0) +
          ($summary['ethereal_profit'] ?? 0.0);
        return $summary;
      },
      $salesDetails['business_summary'] ?? [],
    );

    $compensationDetails = $includeCompensation
      ? $this->collectCompensationDetails($targetBusiness, $startDate, $endDate)
      : [
        'totals' => [
          'gross_pay' => 0.0,
          'total_deductions' => 0.0,
          'net_pay' => 0.0,
        ],
        'counts' => [
          'runs_total' => 0,
          'runs_pending' => 0,
          'runs_finalized' => 0,
        ],
        'entries' => [],
      ];

    $capitalFlowDetails = in_array('portfolio_business_money', $includeSections, true)
      ? $this->collectCapitalFlowDetails($startDate, $endDate, $targetBusiness)
      : [
        'entries' => [],
        'totals' => [
          'portfolio_inflows' => 0.0,
          'portfolio_outflows' => 0.0,
          'business_inflows' => 0.0,
          'business_outflows' => 0.0,
          'debts_outstanding' => 0.0,
          'debts_settled' => 0.0,
          'total_movements' => 0,
        ],
      ];

    $capitalMoneyTotals = in_array('portfolio_business_money', $includeSections, true)
      ? $this->collectCapitalMoneyTotals($targetBusiness)
      : [
        'portfolio_money_total' => 0.0,
        'business_money_total' => 0.0,
        'debts_outstanding' => 0.0,
        'debts_settled' => 0.0,
        'business_breakdown' => [],
      ];

    $staffDetails = in_array('staff', $includeSections, true)
      ? $this->collectStaffDetails($targetBusiness, $startDate, $endDate)
      : ['totals' => ['total_staff' => 0, 'active_staff' => 0, 'inactive_staff' => 0], 'entries' => []];

    $scheduleAttendanceDetails = in_array('schedule_attendance', $includeSections, true)
      ? $this->collectScheduleAttendanceDetails($targetBusiness, $startDate, $endDate)
      : ['totals' => ['day_off_count' => 0, 'absence_count' => 0, 'attendance_related_count' => 0], 'entries' => []];

    $referenceItemsDetails = in_array('reference_items', $includeSections, true)
      ? $this->collectReferenceItemsDetails($targetBusiness)
      : ['totals' => ['total_items' => 0, 'product_items' => 0, 'service_items' => 0], 'entries' => []];

    $expensesDetails = in_array('expenses', $includeSections, true)
      ? $this->collectExpensesDetails($targetBusiness, $startDate, $endDate)
      : ['totals' => ['total_expenses' => 0, 'expense_amount_total' => 0.0], 'entries' => []];

    return [
      'report_type' => $reportType,
      'report_scope' => $reportScope,
      'include_sections' => $includeSections,
      'range' => [
        'start_date' => $startDate->toDateString(),
        'end_date' => $endDate->toDateString(),
      ],
      'totals' => $salesDetails['totals'],
      'counts' => $salesDetails['counts'],
      'business_summary' => $salesDetails['business_summary'],
      'entries' => $salesDetails['entries'],
      'compensation_totals' => $compensationDetails['totals'],
      'compensation_counts' => $compensationDetails['counts'],
      'compensation_entries' => $compensationDetails['entries'],
      'capital_flow_entries' => $capitalFlowDetails['entries'],
      'capital_flow_totals' => $capitalFlowDetails['totals'],
      'capital_money_totals' => $capitalMoneyTotals,
      'staff_details' => $staffDetails,
      'schedule_attendance_details' => $scheduleAttendanceDetails,
      'reference_items_details' => $referenceItemsDetails,
      'expenses_details' => $expensesDetails,
    ];
  }

  private function collectSalesDetails(?Business $business, Carbon $startDate, Carbon $endDate, array $includedSalesSections): array
  {
    $includeGcash = in_array('sales_gcash', $includedSalesSections, true);
    $includeCoffee = in_array('sales_coffee', $includedSalesSections, true);
    $includePrint = in_array('sales_print', $includedSalesSections, true);
    $includeEthereal = in_array('sales_ethereal', $includedSalesSections, true);

    $gcashQuery = GcashSale::query()->whereBetween('transaction_date', [$startDate, $endDate])->orderBy('transaction_date');
    $coffeeQuery = CoffeeSale::query()->whereBetween('sale_date', [$startDate, $endDate])->orderBy('sale_date');
    $printQuery = PrintSale::query()->whereBetween('sale_date', [$startDate, $endDate])->orderBy('sale_date');
    $etherealQuery = EtherealSale::query()->whereBetween('service_date', [$startDate, $endDate])->orderBy('service_date');

    if ($business) {
      $gcashQuery->where('business_id', $business->id);
      $coffeeQuery->where('business_id', $business->id);
      $printQuery->where('business_id', $business->id);
      $etherealQuery->where('business_id', $business->id);
    }

    $gcashEntries = $gcashQuery->get();
    $coffeeEntries = $coffeeQuery->get();
    $printEntries = $printQuery->get();
    $etherealEntries = $etherealQuery->get();

    $businessIds = collect()
      ->merge($includeGcash ? $gcashEntries->pluck('business_id') : [])
      ->merge($includeCoffee ? $coffeeEntries->pluck('business_id') : [])
      ->merge($includePrint ? $printEntries->pluck('business_id') : [])
      ->merge($includeEthereal ? $etherealEntries->pluck('business_id') : [])
      ->filter()->unique()->values()->all();

    $businessDirectory = $this->resolveBusinessDirectory($businessIds);

    if ($business && !isset($businessDirectory[$business->id])) {
      $businessDirectory[$business->id] = [
        'name' => $business->name,
        'slug' => $business->slug,
      ];
    }

    $staffNames = $includeEthereal
      ? $this->resolveStaffNames(
        $etherealEntries->flatMap(fn(EtherealSale $sale) => $sale->staff_ids ?? [$sale->staff_id])->filter()->all()
      )
      : [];

    $entries = [];
    $moduleTotals = ['gcash' => 0.0, 'coffee' => 0.0, 'print' => 0.0, 'ethereal' => 0.0];
    $moduleProfits = ['gcash' => 0.0, 'coffee' => 0.0, 'print' => 0.0, 'ethereal' => 0.0];
    $moduleCounts = ['gcash' => 0, 'coffee' => 0, 'print' => 0, 'ethereal' => 0];
    $businessSummary = [];

    if ($includeGcash) {
      foreach ($gcashEntries as $sale) {
        $businessId = (int)$sale->business_id;
        $businessMeta = $businessDirectory[$businessId]
          ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];

        $amount = round((float)$sale->sales_amount, 2);
        $profit = round((float)$sale->profit_amount, 2); // accumulated here, same pattern as $amount

        $moduleTotals['gcash'] += $amount;
        $moduleProfits['gcash'] += $profit;
        $moduleCounts['gcash']++;

        $businessSummary[$businessId] = $this->accumulateBusinessSummary(
          $businessSummary[$businessId] ?? null,
          $businessId, $businessMeta['name'], $businessMeta['slug'],
          $amount, true,
          $profit, // pass profit so accumulateBusinessSummary can track it per-business
        );

        $entries[] = [
          'module' => 'GCash',
          'business_id' => $businessId,
          'business_slug' => $businessMeta['slug'],
          'business_name' => $businessMeta['name'],
          'sale_name' => $sale->transaction_recipient ?: 'GCash transaction',
          'amount' => $amount,
          'sale_date' => $sale->transaction_date?->toIso8601String(),
          'reference_item_name' => $sale->reference_item_name,
          'reference_item_original_price' => $sale->reference_item_original_price !== null
            ? round((float)$sale->reference_item_original_price, 2) : null,
          'metadata' => [
            'transaction_type' => $sale->transaction_type,
            'amount_moved' => round((float)$sale->amount_moved, 2),
            'profit_amount' => $profit,
            'is_debt' => $sale->is_debt ? 'Yes' : 'No',
            'charged_amount' => $sale->charged_amount !== null ? round((float)$sale->charged_amount, 2) : null,
            'remarks' => $sale->remarks,
          ],
        ];
      }
    }

    if ($includeCoffee) {
      foreach ($coffeeEntries as $sale) {
        $businessId = (int)$sale->business_id;
        $businessMeta = $businessDirectory[$businessId]
          ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];

        $totalAmount = round((float)$sale->price + (float)$sale->add_on_price, 2);

        $moduleTotals['coffee'] += $totalAmount;
        $moduleCounts['coffee']++;

        $businessSummary[$businessId] = $this->accumulateBusinessSummary(
          $businessSummary[$businessId] ?? null,
          $businessId, $businessMeta['name'], $businessMeta['slug'],
          $totalAmount, false,
        );

        $entries[] = [
          'module' => 'Coffee',
          'business_id' => $businessId,
          'business_slug' => $businessMeta['slug'],
          'business_name' => $businessMeta['name'],
          'sale_name' => $sale->coffee_type,
          'amount' => $totalAmount,
          'sale_date' => $sale->sale_date?->toIso8601String(),
          'reference_item_name' => $sale->reference_item_name,
          'reference_item_original_price' => $sale->reference_item_original_price !== null
            ? round((float)$sale->reference_item_original_price, 2) : null,
          'metadata' => [
            'price' => round((float)$sale->price, 2),
            'size' => $sale->size,
            'add_on_price' => round((float)$sale->add_on_price, 2),
            'add_on_description' => $sale->add_on_description,
            'is_debt' => $sale->is_debt ? 'Yes' : 'No',
            'charged_amount' => $sale->charged_amount !== null ? round((float)$sale->charged_amount, 2) : null,
            'remarks' => $sale->remarks,
          ],
        ];
      }
    }

    if ($includePrint) {
      foreach ($printEntries as $sale) {
        $businessId = (int)$sale->business_id;
        $businessMeta = $businessDirectory[$businessId]
          ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];

        $amount = round((float)$sale->sales_amount, 2);

        $moduleTotals['print'] += $amount;
        $moduleCounts['print']++;

        $businessSummary[$businessId] = $this->accumulateBusinessSummary(
          $businessSummary[$businessId] ?? null,
          $businessId, $businessMeta['name'], $businessMeta['slug'],
          $amount, false,
        );

        $entries[] = [
          'module' => 'Print',
          'business_id' => $businessId,
          'business_slug' => $businessMeta['slug'],
          'business_name' => $businessMeta['name'],
          'sale_name' => $sale->description,
          'amount' => $amount,
          'sale_date' => $sale->sale_date?->toIso8601String(),
          'reference_item_name' => $sale->reference_item_name,
          'reference_item_original_price' => $sale->reference_item_original_price !== null
            ? round((float)$sale->reference_item_original_price, 2) : null,
          'metadata' => [
            'job_type' => $sale->job_type,
            'color_mode' => $sale->color_mode,
            'print_size' => $sale->print_size,
            'paper_count' => $sale->paper_count,
            'is_debt' => $sale->is_debt ? 'Yes' : 'No',
            'charged_amount' => $sale->charged_amount !== null ? round((float)$sale->charged_amount, 2) : null,
            'remarks' => $sale->remarks,
          ],
        ];
      }
    }

    if ($includeEthereal) {
      foreach ($etherealEntries as $sale) {
        $businessId = (int)$sale->business_id;
        $businessMeta = $businessDirectory[$businessId]
          ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];

        $providerNames = collect($sale->staff_ids ?? ($sale->staff_id ? [$sale->staff_id] : []))
          ->map(fn($staffId) => $staffNames[(int)$staffId] ?? null)
          ->filter()->values()->all();

        $amount = round((float)$sale->net_amount, 2);

        $moduleTotals['ethereal'] += $amount;
        $moduleCounts['ethereal']++;

        $businessSummary[$businessId] = $this->accumulateBusinessSummary(
          $businessSummary[$businessId] ?? null,
          $businessId, $businessMeta['name'], $businessMeta['slug'],
          $amount, false,
        );

        $entries[] = [
          'module' => 'Ethereal',
          'business_id' => $businessId,
          'business_slug' => $businessMeta['slug'],
          'business_name' => $businessMeta['name'],
          'sale_name' => $sale->service_name ?: 'Beauty service',
          'amount' => $amount,
          'sale_date' => $sale->service_date?->toIso8601String(),
          'reference_item_name' => $sale->reference_item_name,
          'reference_item_original_price' => $sale->reference_item_original_price !== null
            ? round((float)$sale->reference_item_original_price, 2) : null,
          'metadata' => [
            'providers' => implode(', ', $providerNames),
            'customer_name' => $sale->customer_name,
            'service_cost' => round((float)$sale->service_cost, 2),
            'discount' => round((float)$sale->discount_percentage, 2) . '%',
            'discount_type' => $sale->discount_type,
            'cash_discount' => round((float)$sale->cash_discount, 2),
            'is_debt' => $sale->is_debt ? 'Yes' : 'No',
            'charged_amount' => $sale->charged_amount !== null ? round((float)$sale->charged_amount, 2) : null,
            'remarks' => $sale->remarks,
          ],
        ];
      }
    }

    usort($entries, fn(array $a, array $b): int => strcmp((string)($a['sale_date'] ?? ''), (string)($b['sale_date'] ?? '')));

    $businessSummaryRows = array_values($businessSummary);
    usort($businessSummaryRows, fn(array $a, array $b): int => strcmp((string)$a['business_name'], (string)$b['business_name']));

    return [
      'totals' => [
        'gcash_sales' => round($moduleTotals['gcash'], 2),
        'gcash_profit' => round($moduleProfits['gcash'], 2), // ✅ accumulated in loop, not re-summed from collection
        'coffee_sales' => round($moduleTotals['coffee'], 2),
        'coffee_profit' => round($moduleProfits['coffee'], 2),
        'print_sales' => round($moduleTotals['print'], 2),
        'print_profit' => round($moduleProfits['print'], 2),
        'ethereal_sales' => round($moduleTotals['ethereal'], 2),
        'ethereal_profit' => round($moduleProfits['ethereal'], 2),
        'overall_sales' => round(array_sum($moduleTotals), 2),
        // overall_profit is computed in collectDetails from the four *_profit keys above
      ],
      'counts' => [
        'gcash_entries' => $moduleCounts['gcash'],
        'coffee_entries' => $moduleCounts['coffee'],
        'print_entries' => $moduleCounts['print'],
        'ethereal_entries' => $moduleCounts['ethereal'],
        'all_entries' => count($entries),
      ],
      'business_summary' => $businessSummaryRows,
      'entries' => $entries,
    ];
  }

  private function collectCompensationDetails(?Business $business, Carbon $startDate, Carbon $endDate): array
  {
    $runs = CompensationRun::query()
      ->when($business, fn(Builder $query) => $query->where('business_id', $business->id))
      ->whereBetween('period_end', [$startDate->toDateString(), $endDate->toDateString()])
      ->orderBy('period_end')
      ->get();

    $businessDirectory = $this->resolveBusinessDirectory(
      $runs->pluck('business_id')->filter()->unique()->values()->all()
    );

    $entries = $runs->map(function (CompensationRun $run) use ($businessDirectory): array {
      $businessId = (int)$run->business_id;
      $businessMeta = $businessDirectory[$businessId] ?? ['name' => sprintf('Business #%d', $businessId)];

      return [
        'module' => 'Compensation',
        'business_name' => $businessMeta['name'],
        'run_id' => $run->id,
        'entry_name' => sprintf('Compensation Run #%d', $run->id),
        'amount' => round((float)$run->net_pay, 2),
        'entry_date' => $run->finalized_at?->toIso8601String() ?? $run->period_end?->toDateString(),
        'metadata' => [
          'payment_status' => $run->payment_status,
          'computation_mode' => $run->computation_mode,
          'period_start' => $run->period_start?->toDateString(),
          'period_end' => $run->period_end?->toDateString(),
          'gross_pay' => round((float)$run->gross_pay, 2),
          'total_deductions' => round((float)$run->total_deductions, 2),
          'employee_count' => count($run->employee_breakdown ?? []),
        ],
      ];
    })->values()->all();

    return [
      'totals' => [
        'gross_pay' => round((float)$runs->sum(fn(CompensationRun $run) => (float)$run->gross_pay), 2),
        'total_deductions' => round((float)$runs->sum(fn(CompensationRun $run) => (float)$run->total_deductions), 2),
        'net_pay' => round((float)$runs->sum(fn(CompensationRun $run) => (float)$run->net_pay), 2),
      ],
      'counts' => [
        'runs_total' => $runs->count(),
        'runs_pending' => $runs->where('payment_status', 'pending')->count(),
        'runs_finalized' => $runs->where('payment_status', 'finalized')->count(),
      ],
      'entries' => $entries,
    ];
  }

  private function collectCapitalFlowDetails(Carbon $startDate, Carbon $endDate, ?Business $business = null): array
  {
    $movements = CapitalMovement::query()
      ->with(['initiatedByUser:id,name,username', 'sourceBusiness:id,name', 'targetBusiness:id,name', 'settledByUser:id,name'])
      ->whereBetween('occurred_on', [$startDate->toDateString(), $endDate->toDateString()])
      ->when(
        $business,
        fn(Builder $query) => $query->where(function (Builder $nested) use ($business): void {
          $nested
            ->where('source_business_id', $business->id)
            ->orWhere('target_business_id', $business->id);
        })
      )
      ->orderBy('occurred_on')
      ->orderBy('id')
      ->get();

    $entries = $movements->map(function (CapitalMovement $movement): array {
      $initiatedBy = $movement->initiatedByUser;
      $sourceBusiness = $movement->sourceBusiness;
      $targetBusiness = $movement->targetBusiness;
      $settledBy = $movement->settledByUser;

      $who = $initiatedBy ? sprintf('%s (@%s)', $initiatedBy->name, $initiatedBy->username) : 'Unknown';

      $what = match ($movement->direction) {
        'add' => 'Capital Added',
        'deduct' => 'Capital Deducted',
        'transfer' => 'Capital Transfer',
        'debt' => 'Debt Recorded',
        default => ucfirst((string)$movement->direction),
      };

      if ($movement->direction === 'transfer') {
        $where = sprintf(
          'Portfolio → %s',
          $targetBusiness ? $targetBusiness->name : sprintf('Business #%d', $movement->target_business_id)
        );
      } elseif ($movement->source_type === 'business') {
        $where = $sourceBusiness
          ? sprintf('Business: %s', $sourceBusiness->name)
          : sprintf('Business #%d', $movement->source_business_id);
      } else {
        $where = 'Portfolio';
      }

      $entry = [
        'movement_id' => $movement->id,
        'direction' => $movement->direction,
        'source_type' => $movement->source_type,
        'amount' => round((float)$movement->amount, 2),
        'occurred_on' => $movement->occurred_on?->toDateString(),
        'who' => $who,
        'what' => $what,
        'where' => $where,
        'notes' => $movement->notes,
        'remarks' => $movement->remarks,
        'debt_status' => $movement->debt_status,
        'settled_at' => $movement->settled_at?->toDateString(),
        'settled_by' => $settledBy ? sprintf('%s (@%s)', $settledBy->name, $settledBy->username) : null,
      ];

      return $entry;
    })->values()->all();

    $portfolioInflows = round((float)$movements->where('source_type', 'portfolio')->whereIn('direction', ['add'])->sum('amount'), 2);
    $portfolioOutflows = round((float)$movements->where('source_type', 'portfolio')->whereIn('direction', ['deduct', 'transfer', 'debt'])->sum('amount'), 2);
    $businessInflows = round((float)$movements->where('source_type', 'business')->where('direction', 'add')->sum('amount'), 2);
    $businessOutflows = round((float)$movements->where('source_type', 'business')->where('direction', 'deduct')->sum('amount'), 2);
    $totalDebtsOutstanding = round((float)$movements->where('direction', 'debt')->where('debt_status', 'outstanding')->sum('amount'), 2);
    $totalDebtsSettled = round((float)$movements->where('direction', 'debt')->where('debt_status', 'settled')->sum('amount'), 2);

    return [
      'entries' => $entries,
      'totals' => [
        'portfolio_inflows' => $portfolioInflows,
        'portfolio_outflows' => $portfolioOutflows,
        'business_inflows' => $businessInflows,
        'business_outflows' => $businessOutflows,
        'debts_outstanding' => $totalDebtsOutstanding,
        'debts_settled' => $totalDebtsSettled,
        'total_movements' => count($entries),
      ],
    ];
  }

  private function collectCapitalMoneyTotals(?Business $business = null): array
  {
    $portfolioInflows = round((float)CapitalMovement::query()
      ->where('source_type', 'portfolio')
      ->where('direction', 'add')
      ->sum('amount'), 2);
    $portfolioOutflows = round((float)CapitalMovement::query()
      ->where('source_type', 'portfolio')
      ->whereIn('direction', ['deduct', 'transfer', 'debt'])
      ->sum('amount'), 2);

    $transferInflows = CapitalMovement::query()
      ->selectRaw('target_business_id as business_id, SUM(amount) as total_amount')
      ->where('source_type', 'portfolio')
      ->where('direction', 'transfer')
      ->when($business, fn(Builder $query) => $query->where('target_business_id', $business->id))
      ->whereNotNull('target_business_id')
      ->groupBy('target_business_id')
      ->pluck('total_amount', 'business_id');
    $directAdds = CapitalMovement::query()
      ->selectRaw('source_business_id as business_id, SUM(amount) as total_amount')
      ->where('source_type', 'business')
      ->where('direction', 'add')
      ->when($business, fn(Builder $query) => $query->where('source_business_id', $business->id))
      ->whereNotNull('source_business_id')
      ->groupBy('source_business_id')
      ->pluck('total_amount', 'business_id');
    $deductions = CapitalMovement::query()
      ->selectRaw('source_business_id as business_id, SUM(amount) as total_amount')
      ->where('source_type', 'business')
      ->where('direction', 'deduct')
      ->when($business, fn(Builder $query) => $query->where('source_business_id', $business->id))
      ->whereNotNull('source_business_id')
      ->groupBy('source_business_id')
      ->pluck('total_amount', 'business_id');

    $businesses = $business
      ? collect([$business])
      : Business::query()->orderBy('name')->get(['id', 'name']);

    $businessBreakdown = $businesses->map(function (Business $item) use ($transferInflows, $directAdds, $deductions): array {
      $businessId = (int)$item->id;
      $balance = round(
        ((float)($transferInflows[$businessId] ?? 0))
        + ((float)($directAdds[$businessId] ?? 0))
        - ((float)($deductions[$businessId] ?? 0)),
        2
      );

      return [
        'business_id' => $businessId,
        'business_name' => $item->name,
        'money_total' => $balance,
      ];
    })->values()->all();

    $allTimeDebtTotals = CapitalMovement::query()
      ->when(
        $business,
        fn(Builder $query) => $query->where(function (Builder $nested) use ($business): void {
          $nested
            ->where('source_business_id', $business->id)
            ->orWhere('target_business_id', $business->id);
        })
      )
      ->where('direction', 'debt')
      ->selectRaw("
                COALESCE(SUM(CASE WHEN debt_status = 'outstanding' THEN amount ELSE 0 END), 0) as debts_outstanding,
                COALESCE(SUM(CASE WHEN debt_status = 'settled' THEN amount ELSE 0 END), 0) as debts_settled
            ")
      ->first();

    return [
      'portfolio_money_total' => round($portfolioInflows - $portfolioOutflows, 2),
      'business_money_total' => round((float)collect($businessBreakdown)->sum('money_total'), 2),
      'debts_outstanding' => round((float)($allTimeDebtTotals?->debts_outstanding ?? 0), 2),
      'debts_settled' => round((float)($allTimeDebtTotals?->debts_settled ?? 0), 2),
      'business_breakdown' => $businessBreakdown,
    ];
  }

  private function collectStaffDetails(?Business $business, Carbon $startDate, Carbon $endDate): array
  {
    $staffEntries = Staff::query()
      ->when($business, fn(Builder $query) => $query->where('business_id', $business->id))
      ->whereDate('employment_start_date', '<=', $endDate->toDateString())
      ->where(function (Builder $query) use ($startDate): void {
        $query
          ->whereNull('employment_end_date')
          ->orWhereDate('employment_end_date', '>=', $startDate->toDateString());
      })
      ->orderBy('full_name')
      ->get();

    $businessDirectory = $this->resolveBusinessDirectory(
      $staffEntries->pluck('business_id')->filter()->unique()->values()->all()
    );

    $entries = $staffEntries->map(function (Staff $staff) use ($businessDirectory): array {
      $businessMeta = $businessDirectory[(int)$staff->business_id] ?? ['name' => sprintf('Business #%d', $staff->business_id)];

      return [
        'business_name' => $businessMeta['name'],
        'full_name' => $staff->full_name,
        'employment_type' => $staff->employment_type,
        'salary' => round((float)$staff->salary, 2),
        'is_active' => (bool)$staff->is_active,
        'employment_start_date' => $staff->employment_start_date?->toDateString(),
        'employment_end_date' => $staff->employment_end_date?->toDateString(),
      ];
    })->values()->all();

    return [
      'totals' => [
        'total_staff' => count($entries),
        'active_staff' => $staffEntries->where('is_active', true)->count(),
        'inactive_staff' => $staffEntries->where('is_active', false)->count(),
      ],
      'entries' => $entries,
    ];
  }

  private function collectScheduleAttendanceDetails(?Business $business, Carbon $startDate, Carbon $endDate): array
  {
    $dayOffEntries = StaffDayOff::query()
      ->with('staff:id,full_name')
      ->when($business, fn(Builder $query) => $query->where('business_id', $business->id))
      ->whereBetween('day_off_on', [$startDate->toDateString(), $endDate->toDateString()])
      ->orderBy('day_off_on')
      ->get();

    $absenceEntries = StaffAbsence::query()
      ->with('staff:id,full_name')
      ->when($business, fn(Builder $query) => $query->where('business_id', $business->id))
      ->whereBetween('absent_on', [$startDate->toDateString(), $endDate->toDateString()])
      ->orderBy('absent_on')
      ->get();

    $businessDirectory = $this->resolveBusinessDirectory(
      collect()
        ->merge($dayOffEntries->pluck('business_id'))
        ->merge($absenceEntries->pluck('business_id'))
        ->filter()
        ->unique()
        ->values()
        ->all()
    );

    $entries = collect()
      ->merge($dayOffEntries->map(function (StaffDayOff $entry) use ($businessDirectory): array {
        $businessMeta = $businessDirectory[(int)$entry->business_id] ?? ['name' => sprintf('Business #%d', $entry->business_id)];

        return [
          'business_name' => $businessMeta['name'],
          'staff_name' => $entry->staff?->full_name ?? 'Unknown staff',
          'event_type' => 'day_off',
          'event_date' => $entry->day_off_on?->toDateString(),
          'notes' => $entry->notes,
        ];
      }))
      ->merge($absenceEntries->map(function (StaffAbsence $entry) use ($businessDirectory): array {
        $businessMeta = $businessDirectory[(int)$entry->business_id] ?? ['name' => sprintf('Business #%d', $entry->business_id)];

        return [
          'business_name' => $businessMeta['name'],
          'staff_name' => $entry->staff?->full_name ?? 'Unknown staff',
          'event_type' => 'absence',
          'event_date' => $entry->absent_on?->toDateString(),
          'notes' => $entry->notes,
        ];
      }))
      ->sortBy('event_date')
      ->values()
      ->all();

    return [
      'totals' => [
        'day_off_count' => $dayOffEntries->count(),
        'absence_count' => $absenceEntries->count(),
        'attendance_related_count' => count($entries),
      ],
      'entries' => $entries,
    ];
  }

  private function collectReferenceItemsDetails(?Business $business): array
  {
    $items = BusinessReferenceItem::query()
      ->when($business, fn(Builder $query) => $query->where('business_id', $business->id))
      ->orderBy('name')
      ->get();

    $businessDirectory = $this->resolveBusinessDirectory(
      $items->pluck('business_id')->filter()->unique()->values()->all()
    );

    $entries = $items->map(function (BusinessReferenceItem $item) use ($businessDirectory): array {
      $businessMeta = $businessDirectory[(int)$item->business_id] ?? ['name' => sprintf('Business #%d', $item->business_id)];

      return [
        'business_name' => $businessMeta['name'],
        'item_type' => $item->item_type,
        'name' => $item->name,
        'price' => round((float)$item->price, 2),
        'description' => $item->description,
      ];
    })->values()->all();

    return [
      'totals' => [
        'total_items' => count($entries),
        'product_items' => $items->where('item_type', 'product')->count(),
        'service_items' => $items->where('item_type', 'service')->count(),
      ],
      'entries' => $entries,
    ];
  }

  private function collectExpensesDetails(?Business $business, Carbon $startDate, Carbon $endDate): array
  {
    $expenses = Expense::query()
      ->when($business, fn(Builder $query) => $query->where('business_id', $business->id))
      ->whereBetween('date_issued', [$startDate, $endDate])
      ->orderBy('date_issued')
      ->get();

    $businessDirectory = $this->resolveBusinessDirectory(
      $expenses->pluck('business_id')->filter()->unique()->values()->all()
    );

    $entries = $expenses->map(function (Expense $expense) use ($businessDirectory): array {
      $businessMeta = $businessDirectory[(int)$expense->business_id] ?? ['name' => sprintf('Business #%d', $expense->business_id)];

      return [
        'business_name' => $businessMeta['name'],
        'date_issued' => $expense->date_issued?->toDateString(),
        'amount' => round((float)$expense->amount, 2),
        'purpose' => $expense->purpose,
        'description' => $expense->description,
        'recurrence_reference' => $expense->recurrence_reference,
      ];
    })->values()->all();

    return [
      'totals' => [
        'total_expenses' => count($entries),
        'expense_amount_total' => round((float)$expenses->sum('amount'), 2),
      ],
      'entries' => $entries,
    ];
  }

  private function resolveIncludeSections(mixed $rawSections): array
  {
    if (!is_array($rawSections) || count($rawSections) === 0) {
      return self::INCLUDE_SECTIONS;
    }

    $validSections = array_values(array_unique(array_filter(
      $rawSections,
      fn(mixed $section): bool => is_string($section) && in_array($section, self::INCLUDE_SECTIONS, true)
    )));

    return count($validSections) > 0 ? $validSections : self::INCLUDE_SECTIONS;
  }

  private function resolveStaffNames(array $staffIds): array
  {
    if ($staffIds === []) {
      return [];
    }

    return Staff::query()
      ->whereIn('id', array_values(array_unique($staffIds)))
      ->pluck('full_name', 'id')
      ->all();
  }

  private function resolveBusinessDirectory(array $businessIds): array
  {
    if ($businessIds === []) {
      return [];
    }

    return Business::query()
      ->whereIn('id', $businessIds)
      ->get(['id', 'name', 'slug'])
      ->keyBy('id')
      ->map(fn(Business $business): array => [
        'name' => $business->name,
        'slug' => $business->slug,
      ])
      ->all();
  }

  private function accumulateBusinessSummary(
    ?array $current,
    int    $businessId,
    string $businessName,
    string $businessSlug,
    float  $amount,
    bool   $isGcash
  ): array
  {
    $summary = $current ?? [
      'business_id' => $businessId,
      'business_name' => $businessName,
      'business_slug' => $businessSlug,
      'entries_count' => 0,
      'total_sales' => 0.0,
      'gcash_sales' => 0.0,
      'module_sales' => 0.0,
    ];

    $summary['entries_count']++;
    $summary['total_sales'] = round(((float)$summary['total_sales']) + $amount, 2);
    if ($isGcash) {
      $summary['gcash_sales'] = round(((float)$summary['gcash_sales']) + $amount, 2);
    } else {
      $summary['module_sales'] = round(((float)$summary['module_sales']) + $amount, 2);
    }

    return $summary;
  }

  private function generatePdf(SalesReportVersion $report): string
  {
    $metadata = $report->metadata ?? [];
    $details = $report->details ?? [];
    $reportType = (string)($report->report_type ?? ($details['report_type'] ?? 'sales'));

    $base64Pdf = Pdf::view('pdf.sales-report-version', [
      'report' => $report,
      'metadata' => $metadata,
      'details' => $details,
      'reportType' => $reportType,
    ])
      ->driver('dompdf')
      ->paperSize(8.5, 13, 'in')
      ->margins(0.4, 0.4, 0.4, 0.4, 'in')
      ->meta(
        title: (string)$report->document_title,
        author: (string)($metadata['generated_by'] ?? 'System'),
        subject: 'Detailed Business Report',
        keywords: sprintf('report,%s,%s', $reportType, (string)($metadata['business_slug'] ?? 'business')),
        creator: 'Parcon Financial Management System',
        creationDate: now(),
      )
      ->base64();

    return base64_decode($base64Pdf) ?: '';
  }

  private function slugify(string $value): string
  {
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? 'detail-report';

    return trim($value, '-') ?: 'detail-report';
  }

  private function toMoneyString(float $value): string
  {
    return number_format($value, 2, '.', '');
  }

  private function buildDocumentTitle(
    Business $business,
    string   $reportType,
    string   $reportScope,
    array    $includeSections
  ): string
  {
    $sectionLabels = collect($includeSections)
      ->map(function (string $section): string {
        return match ($section) {
          'staff' => 'Staff',
          'schedule_attendance' => 'Schedule & Attendance',
          'compensation' => 'Compensation',
          'reference_items' => 'Reference Items',
          'expenses' => 'Expenses',
          'sales_gcash' => 'Sales GCash',
          'sales_coffee' => 'Sales Coffee',
          'sales_print' => 'Sales Print',
          'sales_ethereal' => 'Sales Ethereal',
          'portfolio_business_money' => 'Portfolio/Business Money & All-Time Debts',
          default => ucwords(str_replace('_', ' ', $section)),
        };
      })
      ->values()
      ->all();

    $scopeLabel = $reportScope === 'all_businesses' ? 'All Businesses' : $business->name;
    $title = sprintf(
      'FINANCIAL REPORTS: %s | %s | %s',
      $scopeLabel,
      ucfirst($reportType),
      count($sectionLabels) > 0 ? implode(', ', $sectionLabels) : 'No Sections'
    );

    return mb_substr($title, 0, 255);
  }

  private function resolveDownloadFilename(SalesReportVersion $report, ?Business $business = null): string
  {
    if ($report->file_path) {
      return basename($report->file_path);
    }

    $documentTitle = trim((string)$report->document_title);
    if ($documentTitle !== '') {
      return sprintf('%s-v%s.pdf', $this->slugify($documentTitle), $report->version);
    }

    $metadataBusinessSlug = (string)(($report->metadata ?? [])['business_slug'] ?? '');
    $businessSlug = $business?->slug;
    if (!$businessSlug) {
      $businessSlug = $metadataBusinessSlug !== '' ? $metadataBusinessSlug : ($report->business?->slug ?? 'business');
    }

    return sprintf('%s-%s-report-v%s.pdf', $businessSlug, $report->report_type ?? 'sales', $report->version);
  }

  private function attachPdfVerification(SalesReportVersion $report): SalesReportVersion
  {
    $report->setAttribute('pdf_verification', $this->verifyStoredPdf($report));

    return $report;
  }

  private function verifyStoredPdf(SalesReportVersion $report): array
  {
    $metadata = $report->metadata ?? [];
    $details = $report->details ?? [];
    $counts = $details['counts'] ?? [];
    $compensationCounts = $details['compensation_counts'] ?? [];
    $entries = $details['entries'] ?? [];
    $compensationEntries = $details['compensation_entries'] ?? [];
    $reportType = (string)($report->report_type ?? ($details['report_type'] ?? 'sales'));
    $filePath = (string)($report->file_path ?? '');
    $storedFileName = (string)($metadata['stored_file_name'] ?? basename($filePath));
    $hasStoredFile = $filePath !== '' && Storage::disk('local')->exists($filePath);

    $includeSales = in_array($reportType, ['sales', 'combined'], true);
    $includeCompensation = in_array($reportType, ['compensation', 'combined'], true);

    $metadataChecks = [
      'business_name' => trim((string)($metadata['business_name'] ?? '')) !== '',
      'generated_at' => trim((string)($metadata['generated_at'] ?? '')) !== '',
      'generated_by' => trim((string)($metadata['generated_by'] ?? '')) !== '',
      'stored_file_name' => trim($storedFileName) !== '',
      'report_type' => (string)($metadata['report_type'] ?? '') === $reportType,
    ];

    $moduleChecks = [
      'gcash' => !$includeSales || ((int)($counts['gcash_entries'] ?? 0) === count(array_filter($entries, fn(array $entry) => ($entry['module'] ?? '') === 'GCash'))),
      'coffee' => !$includeSales || ((int)($counts['coffee_entries'] ?? 0) === count(array_filter($entries, fn(array $entry) => ($entry['module'] ?? '') === 'Coffee'))),
      'print' => !$includeSales || ((int)($counts['print_entries'] ?? 0) === count(array_filter($entries, fn(array $entry) => ($entry['module'] ?? '') === 'Print'))),
      'ethereal' => !$includeSales || ((int)($counts['ethereal_entries'] ?? 0) === count(array_filter($entries, fn(array $entry) => ($entry['module'] ?? '') === 'Ethereal'))),
      'compensation' => !$includeCompensation || ((int)($compensationCounts['runs_total'] ?? 0) === count($compensationEntries)),
    ];

    $allMetadataMatched = !in_array(false, $metadataChecks, true);
    $allModulesMatched = !in_array(false, $moduleChecks, true);

    return [
      'status' => $hasStoredFile && $allMetadataMatched && $allModulesMatched ? 'verified' : ($hasStoredFile ? 'mismatch' : 'missing_file'),
      'checked_at' => now()->toIso8601String(),
      'file_exists' => $hasStoredFile,
      'metadata_checks' => $metadataChecks,
      'module_checks' => $moduleChecks,
    ];
  }
}
