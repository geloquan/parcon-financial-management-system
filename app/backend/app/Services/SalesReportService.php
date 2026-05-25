<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CapitalMovement;
use App\Models\CoffeeSale;
use App\Models\CompensationRun;
use App\Models\EtherealSale;
use App\Models\GcashSale;
use App\Models\PrintSale;
use App\Models\SalesReportVersion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelPdf\Facades\Pdf;

class SalesReportService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        $reportScope = request()->query('report_scope');

        $paginator = SalesReportVersion::query()
            ->where('business_id', $business->id)
            ->when(
                in_array($reportScope, ['business', 'all_businesses'], true),
                fn (Builder $query) => $query->where('metadata->report_scope', $reportScope)
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
        $businessId = $validated['scope'] === 'business' ? (int) $validated['business_id'] : null;
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

        $gcashTotal = (float) (clone $gcashQuery)->sum('sales_amount');
        $coffeeTotal = (float) ((clone $coffeeQuery)->selectRaw('COALESCE(SUM(price + add_on_price), 0) as total_amount')->value('total_amount') ?? 0);
        $printTotal = (float) (clone $printQuery)->sum('sales_amount');
        $etherealTotal = (float) (clone $etherealQuery)->sum('net_amount');
        $salesTotal = $gcashTotal + $coffeeTotal + $printTotal + $etherealTotal;
        $transactionCount = (int) (clone $gcashQuery)->count()
            + (int) (clone $coffeeQuery)->count()
            + (int) (clone $printQuery)->count()
            + (int) (clone $etherealQuery)->count();

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
        $reportType = (string) ($validated['report_type'] ?? 'sales');
        $reportScope = (string) ($validated['report_scope'] ?? 'business');

        $nextVersion = (int) SalesReportVersion::query()
            ->where('business_id', $business->id)
            ->max('version') + 1;

        $details = $this->collectDetails($business, $startDate, $endDate, $reportType, $reportScope);
        $now = now();

        $report = SalesReportVersion::query()->create([
            'business_id' => $business->id,
            'generated_by_user_id' => $user->id,
            'version' => $nextVersion,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'document_title' => $validated['document_title'] ?: (
                $reportScope === 'all_businesses'
                    ? 'All Businesses Detail Report'
                    : sprintf('%s Detail Report', $business->name)
            ),
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
            Carbon::parse((string) $validated['start_date'])->startOfDay(),
            Carbon::parse((string) $validated['end_date'])->endOfDay(),
        ];
    }

    private function applyDateRange(Builder $query, string $column, Carbon $startAt, Carbon $endAt): void
    {
        $query->whereBetween($column, [$startAt, $endAt]);
    }

    private function collectDetails(Business $business, Carbon $startDate, Carbon $endDate, string $reportType, string $reportScope): array
    {
        $includeSales = in_array($reportType, ['sales', 'combined'], true);
        $includeCompensation = in_array($reportType, ['compensation', 'combined'], true);
        $isAllBusinesses = $reportScope === 'all_businesses';
        $targetBusiness = $isAllBusinesses ? null : $business;

        $salesDetails = $includeSales
            ? $this->collectSalesDetails($targetBusiness, $startDate, $endDate)
            : [
                'totals' => [
                    'gcash_sales' => 0.0,
                    'gcash_profit' => 0.0,
                    'coffee_sales' => 0.0,
                    'print_sales' => 0.0,
                    'ethereal_sales' => 0.0,
                    'overall_sales' => 0.0,
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

        $capitalFlowDetails = $isAllBusinesses
            ? $this->collectCapitalFlowDetails($startDate, $endDate)
            : ['entries' => [], 'totals' => []];

        return [
            'report_type' => $reportType,
            'report_scope' => $reportScope,
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
        ];
    }

    private function collectSalesDetails(?Business $business, Carbon $startDate, Carbon $endDate): array
    {
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
            ->merge($gcashEntries->pluck('business_id'))
            ->merge($coffeeEntries->pluck('business_id'))
            ->merge($printEntries->pluck('business_id'))
            ->merge($etherealEntries->pluck('business_id'))
            ->filter()
            ->unique()
            ->values()
            ->all();
        $businessDirectory = $this->resolveBusinessDirectory($businessIds);

        if ($business && !isset($businessDirectory[$business->id])) {
            $businessDirectory[$business->id] = [
                'name' => $business->name,
                'slug' => $business->slug,
            ];
        }

        $staffNames = $this->resolveStaffNames(
            $etherealEntries->flatMap(fn (EtherealSale $sale) => $sale->staff_ids ?? [$sale->staff_id])->filter()->all()
        );

        $entries = [];
        $moduleTotals = [
            'gcash' => 0.0,
            'coffee' => 0.0,
            'print' => 0.0,
            'ethereal' => 0.0,
        ];
        $moduleCounts = [
            'gcash' => 0,
            'coffee' => 0,
            'print' => 0,
            'ethereal' => 0,
        ];
        $businessSummary = [];

        foreach ($gcashEntries as $sale) {
            $businessId = (int) $sale->business_id;
            $businessMeta = $businessDirectory[$businessId] ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];
            $amount = round((float) $sale->sales_amount, 2);
            $moduleTotals['gcash'] += $amount;
            $moduleCounts['gcash']++;
            $businessSummary[$businessId] = $this->accumulateBusinessSummary($businessSummary[$businessId] ?? null, $businessId, $businessMeta['name'], $businessMeta['slug'], $amount, true);
            $entries[] = [
                'module' => 'GCash',
                'business_id' => $businessId,
                'business_slug' => $businessMeta['slug'],
                'business_name' => $businessMeta['name'],
                'sale_name' => $sale->transaction_recipient ?: 'GCash transaction',
                'amount' => $amount,
                'sale_date' => $sale->transaction_date?->toIso8601String(),
                'reference_item_name' => $sale->reference_item_name,
                'reference_item_original_price' => $sale->reference_item_original_price !== null ? round((float) $sale->reference_item_original_price, 2) : null,
                'metadata' => [
                    'transaction_type' => $sale->transaction_type,
                    'amount_moved' => round((float) $sale->amount_moved, 2),
                    'profit_amount' => round((float) $sale->profit_amount, 2),
                ],
            ];
        }

        foreach ($coffeeEntries as $sale) {
            $businessId = (int) $sale->business_id;
            $businessMeta = $businessDirectory[$businessId] ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];
            $totalAmount = round((float) $sale->price + (float) $sale->add_on_price, 2);
            $moduleTotals['coffee'] += $totalAmount;
            $moduleCounts['coffee']++;
            $businessSummary[$businessId] = $this->accumulateBusinessSummary($businessSummary[$businessId] ?? null, $businessId, $businessMeta['name'], $businessMeta['slug'], $totalAmount, false);
            $entries[] = [
                'module' => 'Coffee',
                'business_id' => $businessId,
                'business_slug' => $businessMeta['slug'],
                'business_name' => $businessMeta['name'],
                'sale_name' => $sale->coffee_type,
                'amount' => $totalAmount,
                'sale_date' => $sale->sale_date?->toIso8601String(),
                'reference_item_name' => $sale->reference_item_name,
                'reference_item_original_price' => $sale->reference_item_original_price !== null ? round((float) $sale->reference_item_original_price, 2) : null,
                'metadata' => [
                    'price' => round((float) $sale->price, 2),
                    'size' => $sale->size,
                    'add_on_price' => round((float) $sale->add_on_price, 2),
                    'add_on_description' => $sale->add_on_description,
                ],
            ];
        }

        foreach ($printEntries as $sale) {
            $businessId = (int) $sale->business_id;
            $businessMeta = $businessDirectory[$businessId] ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];
            $amount = round((float) $sale->sales_amount, 2);
            $moduleTotals['print'] += $amount;
            $moduleCounts['print']++;
            $businessSummary[$businessId] = $this->accumulateBusinessSummary($businessSummary[$businessId] ?? null, $businessId, $businessMeta['name'], $businessMeta['slug'], $amount, false);
            $entries[] = [
                'module' => 'Print',
                'business_id' => $businessId,
                'business_slug' => $businessMeta['slug'],
                'business_name' => $businessMeta['name'],
                'sale_name' => $sale->description,
                'amount' => $amount,
                'sale_date' => $sale->sale_date?->toIso8601String(),
                'reference_item_name' => $sale->reference_item_name,
                'reference_item_original_price' => $sale->reference_item_original_price !== null ? round((float) $sale->reference_item_original_price, 2) : null,
                'metadata' => [
                    'job_type' => $sale->job_type,
                    'color_mode' => $sale->color_mode,
                    'print_size' => $sale->print_size,
                    'paper_count' => $sale->paper_count,
                ],
            ];
        }

        foreach ($etherealEntries as $sale) {
            $businessId = (int) $sale->business_id;
            $businessMeta = $businessDirectory[$businessId] ?? ['name' => sprintf('Business #%d', $businessId), 'slug' => sprintf('business-%d', $businessId)];
            $providerNames = collect($sale->staff_ids ?? ($sale->staff_id ? [$sale->staff_id] : []))
                ->map(fn ($staffId) => $staffNames[(int) $staffId] ?? null)
                ->filter()
                ->values()
                ->all();

            $amount = round((float) $sale->net_amount, 2);
            $moduleTotals['ethereal'] += $amount;
            $moduleCounts['ethereal']++;
            $businessSummary[$businessId] = $this->accumulateBusinessSummary($businessSummary[$businessId] ?? null, $businessId, $businessMeta['name'], $businessMeta['slug'], $amount, false);
            $entries[] = [
                'module' => 'Ethereal',
                'business_id' => $businessId,
                'business_slug' => $businessMeta['slug'],
                'business_name' => $businessMeta['name'],
                'sale_name' => $sale->service_name ?: 'Beauty service',
                'amount' => $amount,
                'sale_date' => $sale->service_date?->toIso8601String(),
                'reference_item_name' => $sale->reference_item_name,
                'reference_item_original_price' => $sale->reference_item_original_price !== null ? round((float) $sale->reference_item_original_price, 2) : null,
                'metadata' => [
                    'providers' => implode(', ', $providerNames),
                    'customer_name' => $sale->customer_name,
                    'service_cost' => round((float) $sale->service_cost, 2),
                    'discount' => round((float) $sale->discount_percentage, 2) . '%',
                    'discount_type' => $sale->discount_type,
                    'cash_discount' => round((float) $sale->cash_discount, 2),
                ],
            ];
        }

        usort($entries, fn (array $a, array $b): int => strcmp((string) ($a['sale_date'] ?? ''), (string) ($b['sale_date'] ?? '')));

        $businessSummaryRows = array_values($businessSummary);
        usort($businessSummaryRows, fn (array $a, array $b): int => strcmp((string) $a['business_name'], (string) $b['business_name']));

        return [
            'totals' => [
                'gcash_sales' => round($moduleTotals['gcash'], 2),
                'gcash_profit' => round((float) $gcashEntries->sum('profit_amount'), 2),
                'coffee_sales' => round($moduleTotals['coffee'], 2),
                'print_sales' => round($moduleTotals['print'], 2),
                'ethereal_sales' => round($moduleTotals['ethereal'], 2),
                'overall_sales' => round(array_sum($moduleTotals), 2),
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
            ->when($business, fn (Builder $query) => $query->where('business_id', $business->id))
            ->whereBetween('period_end', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('period_end')
            ->get();

        $businessDirectory = $this->resolveBusinessDirectory(
            $runs->pluck('business_id')->filter()->unique()->values()->all()
        );

        $entries = $runs->map(function (CompensationRun $run) use ($businessDirectory): array {
            $businessId = (int) $run->business_id;
            $businessMeta = $businessDirectory[$businessId] ?? ['name' => sprintf('Business #%d', $businessId)];

            return [
                'module' => 'Compensation',
                'business_name' => $businessMeta['name'],
                'run_id' => $run->id,
                'entry_name' => sprintf('Compensation Run #%d', $run->id),
                'amount' => round((float) $run->net_pay, 2),
                'entry_date' => $run->finalized_at?->toIso8601String() ?? $run->period_end?->toDateString(),
                'metadata' => [
                    'payment_status' => $run->payment_status,
                    'computation_mode' => $run->computation_mode,
                    'period_start' => $run->period_start?->toDateString(),
                    'period_end' => $run->period_end?->toDateString(),
                    'gross_pay' => round((float) $run->gross_pay, 2),
                    'total_deductions' => round((float) $run->total_deductions, 2),
                    'employee_count' => count($run->employee_breakdown ?? []),
                ],
            ];
        })->values()->all();

        return [
            'totals' => [
                'gross_pay' => round((float) $runs->sum(fn (CompensationRun $run) => (float) $run->gross_pay), 2),
                'total_deductions' => round((float) $runs->sum(fn (CompensationRun $run) => (float) $run->total_deductions), 2),
                'net_pay' => round((float) $runs->sum(fn (CompensationRun $run) => (float) $run->net_pay), 2),
            ],
            'counts' => [
                'runs_total' => $runs->count(),
                'runs_pending' => $runs->where('payment_status', 'pending')->count(),
                'runs_finalized' => $runs->where('payment_status', 'finalized')->count(),
            ],
            'entries' => $entries,
        ];
    }

    private function collectCapitalFlowDetails(Carbon $startDate, Carbon $endDate): array
    {
        $movements = CapitalMovement::query()
            ->with(['initiatedByUser:id,name,username', 'sourceBusiness:id,name', 'targetBusiness:id,name', 'settledByUser:id,name'])
            ->whereBetween('occurred_on', [$startDate->toDateString(), $endDate->toDateString()])
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
                default => ucfirst((string) $movement->direction),
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
                'amount' => round((float) $movement->amount, 2),
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

        $portfolioInflows = round((float) $movements->where('source_type', 'portfolio')->whereIn('direction', ['add'])->sum('amount'), 2);
        $portfolioOutflows = round((float) $movements->where('source_type', 'portfolio')->whereIn('direction', ['deduct', 'transfer'])->sum('amount'), 2);
        $businessInflows = round((float) $movements->where('source_type', 'business')->where('direction', 'add')->sum('amount'), 2);
        $businessOutflows = round((float) $movements->where('source_type', 'business')->where('direction', 'deduct')->sum('amount'), 2);
        $totalDebtsOutstanding = round((float) $movements->where('direction', 'debt')->where('debt_status', 'outstanding')->sum('amount'), 2);
        $totalDebtsSettled = round((float) $movements->where('direction', 'debt')->where('debt_status', 'settled')->sum('amount'), 2);

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

    private function resolveStaffNames(array $staffIds): array
    {
        if ($staffIds === []) {
            return [];
        }

        return \App\Models\Staff::query()
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
            ->map(fn (Business $business): array => [
                'name' => $business->name,
                'slug' => $business->slug,
            ])
            ->all();
    }

    private function accumulateBusinessSummary(
        ?array $current,
        int $businessId,
        string $businessName,
        string $businessSlug,
        float $amount,
        bool $isGcash
    ): array {
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
        $summary['total_sales'] = round(((float) $summary['total_sales']) + $amount, 2);
        if ($isGcash) {
            $summary['gcash_sales'] = round(((float) $summary['gcash_sales']) + $amount, 2);
        } else {
            $summary['module_sales'] = round(((float) $summary['module_sales']) + $amount, 2);
        }

        return $summary;
    }

    private function generatePdf(SalesReportVersion $report): string
    {
        $metadata = $report->metadata ?? [];
        $details = $report->details ?? [];
        $reportType = (string) ($report->report_type ?? ($details['report_type'] ?? 'sales'));

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
                title: (string) $report->document_title,
                author: (string) ($metadata['generated_by'] ?? 'System'),
                subject: 'Detailed Business Report',
                keywords: sprintf('report,%s,%s', $reportType, (string) ($metadata['business_slug'] ?? 'business')),
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

    private function resolveDownloadFilename(SalesReportVersion $report, ?Business $business = null): string
    {
        if ($report->file_path) {
            return basename($report->file_path);
        }

        $metadataBusinessSlug = (string) (($report->metadata ?? [])['business_slug'] ?? '');
        $businessSlug = $business?->slug;
        if (! $businessSlug) {
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
        $reportType = (string) ($report->report_type ?? ($details['report_type'] ?? 'sales'));
        $filePath = (string) ($report->file_path ?? '');
        $storedFileName = (string) ($metadata['stored_file_name'] ?? basename($filePath));
        $hasStoredFile = $filePath !== '' && Storage::disk('local')->exists($filePath);

        $includeSales = in_array($reportType, ['sales', 'combined'], true);
        $includeCompensation = in_array($reportType, ['compensation', 'combined'], true);

        $metadataChecks = [
            'business_name' => trim((string) ($metadata['business_name'] ?? '')) !== '',
            'generated_at' => trim((string) ($metadata['generated_at'] ?? '')) !== '',
            'generated_by' => trim((string) ($metadata['generated_by'] ?? '')) !== '',
            'stored_file_name' => trim($storedFileName) !== '',
            'report_type' => (string) ($metadata['report_type'] ?? '') === $reportType,
        ];

        $moduleChecks = [
            'gcash' => ! $includeSales || ((int) ($counts['gcash_entries'] ?? 0) === count(array_filter($entries, fn (array $entry) => ($entry['module'] ?? '') === 'GCash'))),
            'coffee' => ! $includeSales || ((int) ($counts['coffee_entries'] ?? 0) === count(array_filter($entries, fn (array $entry) => ($entry['module'] ?? '') === 'Coffee'))),
            'print' => ! $includeSales || ((int) ($counts['print_entries'] ?? 0) === count(array_filter($entries, fn (array $entry) => ($entry['module'] ?? '') === 'Print'))),
            'ethereal' => ! $includeSales || ((int) ($counts['ethereal_entries'] ?? 0) === count(array_filter($entries, fn (array $entry) => ($entry['module'] ?? '') === 'Ethereal'))),
            'compensation' => ! $includeCompensation || ((int) ($compensationCounts['runs_total'] ?? 0) === count($compensationEntries)),
        ];

        $allMetadataMatched = ! in_array(false, $metadataChecks, true);
        $allModulesMatched = ! in_array(false, $moduleChecks, true);

        return [
            'status' => $hasStoredFile && $allMetadataMatched && $allModulesMatched ? 'verified' : ($hasStoredFile ? 'mismatch' : 'missing_file'),
            'checked_at' => now()->toIso8601String(),
            'file_exists' => $hasStoredFile,
            'metadata_checks' => $metadataChecks,
            'module_checks' => $moduleChecks,
        ];
    }
}
