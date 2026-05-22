<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CoffeeSale;
use App\Models\EtherealSale;
use App\Models\GcashSale;
use App\Models\PrintSale;
use App\Models\SalesReportVersion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;

class SalesReportService
{
    private const PDF_PAGE_WIDTH = 612;
    private const PDF_PAGE_HEIGHT = 936;
    private const PDF_MARGIN = 36;

    public function paginate(Business $business): LengthAwarePaginator
    {
        return SalesReportVersion::query()
            ->where('business_id', $business->id)
            ->latest('id')
            ->paginate(10);
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

        $nextVersion = (int) SalesReportVersion::query()
            ->where('business_id', $business->id)
            ->max('version') + 1;

        $details = $this->collectDetails($business, $startDate, $endDate);
        $now = now();

        $report = SalesReportVersion::query()->create([
            'business_id' => $business->id,
            'generated_by_user_id' => $user->id,
            'version' => $nextVersion,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'document_title' => $validated['document_title'] ?: sprintf('%s Sales Report', $business->name),
            'document_format' => 'pdf-8.5x13',
            'metadata' => [
                'page_size' => '8.5x13in',
                'generated_at' => $now->toIso8601String(),
                'generated_by' => $user->name,
                'generated_by_username' => $user->username,
                'business_name' => $business->name,
                'business_slug' => $business->slug,
                'report_scope' => 'business',
                'stored_disk' => 'local',
            ],
            'details' => $details,
        ]);

        $pdf = $this->generatePdf($report);
        $filePath = sprintf('sales-reports/%s/%s-v%s-%s.pdf', $business->slug, $this->slugify($report->document_title), $report->version, $report->id);
        Storage::disk('local')->put($filePath, $pdf);

        $report->update([
            'file_path' => $filePath,
            'file_size_bytes' => strlen($pdf),
            'metadata' => [
                ...($report->metadata ?? []),
                'stored_file_name' => basename($filePath),
            ],
        ]);

        return $report->refresh();
    }

    public function download(Business $business, SalesReportVersion $report): array
    {
        $filename = $report->file_path ? basename($report->file_path) : sprintf('%s-sales-report-v%s.pdf', $business->slug, $report->version);

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

    private function collectDetails(Business $business, Carbon $startDate, Carbon $endDate): array
    {
        $gcashEntries = GcashSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->orderBy('transaction_date')
            ->get();

        $coffeeEntries = CoffeeSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->orderBy('sale_date')
            ->get();

        $printEntries = PrintSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->orderBy('sale_date')
            ->get();

        $etherealEntries = EtherealSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('service_date', [$startDate, $endDate])
            ->orderBy('service_date')
            ->get();

        $staffNames = $this->resolveStaffNames($business->id, $etherealEntries->flatMap(fn (EtherealSale $sale) => $sale->staff_ids ?? [$sale->staff_id])->filter()->all());

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

        foreach ($gcashEntries as $sale) {
            $moduleTotals['gcash'] += (float) $sale->sales_amount;
            $moduleCounts['gcash']++;
            $entries[] = [
                'module' => 'GCash',
                'business_name' => $business->name,
                'sale_name' => $sale->transaction_recipient ?: 'GCash transaction',
                'amount' => round((float) $sale->sales_amount, 2),
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
            $totalAmount = round((float) $sale->price + (float) $sale->add_on_price, 2);
            $moduleTotals['coffee'] += $totalAmount;
            $moduleCounts['coffee']++;
            $entries[] = [
                'module' => 'Coffee',
                'business_name' => $business->name,
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
            $moduleTotals['print'] += (float) $sale->sales_amount;
            $moduleCounts['print']++;
            $entries[] = [
                'module' => 'Print',
                'business_name' => $business->name,
                'sale_name' => $sale->description,
                'amount' => round((float) $sale->sales_amount, 2),
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
            $providerNames = collect($sale->staff_ids ?? ($sale->staff_id ? [$sale->staff_id] : []))
                ->map(fn ($staffId) => $staffNames[(int) $staffId] ?? null)
                ->filter()
                ->values()
                ->all();

            $moduleTotals['ethereal'] += (float) $sale->net_amount;
            $moduleCounts['ethereal']++;
            $entries[] = [
                'module' => 'Ethereal',
                'business_name' => $business->name,
                'sale_name' => $sale->service_name ?: 'Beauty service',
                'amount' => round((float) $sale->net_amount, 2),
                'sale_date' => $sale->service_date?->toIso8601String(),
                'reference_item_name' => $sale->reference_item_name,
                'reference_item_original_price' => $sale->reference_item_original_price !== null ? round((float) $sale->reference_item_original_price, 2) : null,
                'metadata' => [
                    'providers' => implode(', ', $providerNames),
                    'customer_name' => $sale->customer_name,
                    'service_cost' => round((float) $sale->service_cost, 2),
                    'discount_percentage' => round((float) $sale->discount_percentage, 2),
                    'discount_type' => $sale->discount_type,
                    'cash_discount' => round((float) $sale->cash_discount, 2),
                ],
            ];
        }

        usort($entries, fn (array $a, array $b): int => strcmp((string) ($a['sale_date'] ?? ''), (string) ($b['sale_date'] ?? '')));

        return [
            'range' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'totals' => [
                'gcash_sales' => round($moduleTotals['gcash'], 2),
                'gcash_profit' => round($gcashEntries->sum('profit_amount'), 2),
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
            'entries' => $entries,
        ];
    }

    private function resolveStaffNames(int $businessId, array $staffIds): array
    {
        if ($staffIds === []) {
            return [];
        }

        return \App\Models\Staff::query()
            ->where('business_id', $businessId)
            ->whereIn('id', array_values(array_unique($staffIds)))
            ->pluck('full_name', 'id')
            ->all();
    }

    private function generatePdf(SalesReportVersion $report): string
    {
        $metadata = $report->metadata ?? [];
        $details = $report->details ?? [];
        $totals = $details['totals'] ?? [];
        $counts = $details['counts'] ?? [];
        $entries = $details['entries'] ?? [];

        $pages = [];
        $pageIndex = $this->startPdfPage($pages);
        $cursorY = self::PDF_PAGE_HEIGHT - self::PDF_MARGIN;

        $this->pdfText($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $report->document_title, 18, 'bold', [133, 32, 48]);
        $cursorY -= 24;
        $this->pdfText($pages[$pageIndex], self::PDF_MARGIN, $cursorY, sprintf('Business: %s', $metadata['business_name'] ?? 'N/A'), 10, 'regular', [44, 36, 34]);
        $this->pdfText($pages[$pageIndex], 360, $cursorY, sprintf('Version: %s', $report->version), 10, 'regular', [44, 36, 34]);
        $cursorY -= 14;
        $this->pdfText($pages[$pageIndex], self::PDF_MARGIN, $cursorY, sprintf('Date Range: %s to %s', $report->start_date?->toDateString(), $report->end_date?->toDateString()), 10, 'regular', [44, 36, 34]);
        $this->pdfText($pages[$pageIndex], 360, $cursorY, sprintf('Generated At: %s', $metadata['generated_at'] ?? ''), 10, 'regular', [44, 36, 34]);
        $cursorY -= 14;
        $this->pdfText($pages[$pageIndex], self::PDF_MARGIN, $cursorY, sprintf('Generated By: %s (%s)', $metadata['generated_by'] ?? 'N/A', $metadata['generated_by_username'] ?? 'N/A'), 10, 'regular', [44, 36, 34]);
        $this->pdfText($pages[$pageIndex], 360, $cursorY, sprintf('Stored File: %s', $metadata['stored_file_name'] ?? basename((string) $report->file_path)), 10, 'regular', [44, 36, 34]);
        $cursorY -= 24;

        $summaryHeaderY = $cursorY;
        $summaryColumns = [
            ['label' => 'Module', 'width' => 180],
            ['label' => 'Entries', 'width' => 90],
            ['label' => 'Amount', 'width' => 120],
            ['label' => 'Notes', 'width' => 150],
        ];
        $this->drawTableHeader($pages[$pageIndex], self::PDF_MARGIN, $summaryHeaderY, $summaryColumns);
        $cursorY -= 24;

        $summaryRows = [
            ['GCash', (string) ($counts['gcash_entries'] ?? 0), $this->toMoneyString((float) ($totals['gcash_sales'] ?? 0)), 'Profit ' . $this->toMoneyString((float) ($totals['gcash_profit'] ?? 0))],
            ['Coffee', (string) ($counts['coffee_entries'] ?? 0), $this->toMoneyString((float) ($totals['coffee_sales'] ?? 0)), 'Orders recorded'],
            ['Print', (string) ($counts['print_entries'] ?? 0), $this->toMoneyString((float) ($totals['print_sales'] ?? 0)), 'Jobs recorded'],
            ['Ethereal', (string) ($counts['ethereal_entries'] ?? 0), $this->toMoneyString((float) ($totals['ethereal_sales'] ?? 0)), 'Services recorded'],
            ['Overall', (string) ($counts['all_entries'] ?? count($entries)), $this->toMoneyString((float) ($totals['overall_sales'] ?? 0)), 'All active sales in range'],
        ];

        foreach ($summaryRows as $row) {
            $rowHeight = $this->calculateRowHeight($row, $summaryColumns, 9);
            $this->ensurePdfSpace($pages, $pageIndex, $cursorY, $rowHeight + 20, $summaryColumns, true, 'Sales Summary');
            if ($cursorY <= 140) {
                $pageIndex = array_key_last($pages);
                $cursorY = $pages[$pageIndex]['cursor_y'];
            }
            $this->drawTableRow($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $summaryColumns, $row, $rowHeight, 9);
            $cursorY -= $rowHeight;
            $pages[$pageIndex]['cursor_y'] = $cursorY;
        }

        $cursorY -= 24;
        $detailColumns = [
            ['label' => '#', 'width' => 24],
            ['label' => 'Module', 'width' => 58],
            ['label' => 'Business', 'width' => 78],
            ['label' => 'Sale', 'width' => 100],
            ['label' => 'Amount', 'width' => 60],
            ['label' => 'Original', 'width' => 60],
            ['label' => 'Date', 'width' => 82],
            ['label' => 'Metadata', 'width' => 78],
        ];

        $this->ensurePdfSpace($pages, $pageIndex, $cursorY, 80, $detailColumns, true, 'Sales Detail Table');
        if ($cursorY <= 140) {
            $pageIndex = array_key_last($pages);
            $cursorY = $pages[$pageIndex]['cursor_y'];
        }

        $this->pdfText($pages[$pageIndex], self::PDF_MARGIN, $cursorY, 'Sales Detail Table', 12, 'bold', [92, 18, 32]);
        $cursorY -= 16;
        $this->drawTableHeader($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $detailColumns);
        $cursorY -= 24;

        foreach ($entries as $index => $entry) {
            $row = [
                (string) ($index + 1),
                (string) ($entry['module'] ?? ''),
                (string) ($entry['business_name'] ?? ''),
                (string) ($entry['sale_name'] ?? ''),
                $this->toMoneyString((float) ($entry['amount'] ?? 0)),
                $entry['reference_item_original_price'] !== null ? $this->toMoneyString((float) $entry['reference_item_original_price']) : '—',
                $this->formatPdfDate((string) ($entry['sale_date'] ?? '')),
                $this->formatMetadataText($entry),
            ];

            $rowHeight = $this->calculateRowHeight($row, $detailColumns, 8.5);
            if ($cursorY - $rowHeight < 80) {
                $pageIndex = $this->startPdfPage($pages);
                $cursorY = self::PDF_PAGE_HEIGHT - self::PDF_MARGIN;
                $this->pdfText($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $report->document_title . ' (continued)', 12, 'bold', [92, 18, 32]);
                $cursorY -= 16;
                $this->drawTableHeader($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $detailColumns);
                $cursorY -= 24;
            }

            $this->drawTableRow($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $detailColumns, $row, $rowHeight, 8.5);
            $cursorY -= $rowHeight;
        }

        foreach ($pages as $pageNumber => &$page) {
            $footerY = 24;
            $this->pdfLine($page, self::PDF_MARGIN, $footerY + 12, self::PDF_PAGE_WIDTH - self::PDF_MARGIN, $footerY + 12, [224, 219, 213], 0.6);
            $this->pdfText($page, self::PDF_MARGIN, $footerY, sprintf('Business: %s', $metadata['business_name'] ?? 'N/A'), 9, 'regular', [122, 106, 90]);
            $this->pdfText($page, 240, $footerY, sprintf('Format: %s · Size: %s', $report->document_format, $metadata['page_size'] ?? '8.5x13in'), 9, 'regular', [122, 106, 90]);
            $this->pdfText($page, 500, $footerY, sprintf('Page %d', $pageNumber + 1), 9, 'regular', [122, 106, 90]);
        }
        unset($page);

        return $this->buildPdfDocument($pages);
    }

    private function startPdfPage(array &$pages): int
    {
        $pages[] = [
            'commands' => [],
            'cursor_y' => self::PDF_PAGE_HEIGHT - self::PDF_MARGIN,
        ];

        return array_key_last($pages);
    }

    private function ensurePdfSpace(array &$pages, int &$pageIndex, float $cursorY, float $requiredHeight, array $columns, bool $drawHeader, string $title): void
    {
        if ($cursorY - $requiredHeight >= 80) {
            return;
        }

        $pageIndex = $this->startPdfPage($pages);
        $cursorY = self::PDF_PAGE_HEIGHT - self::PDF_MARGIN;
        $this->pdfText($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $title, 12, 'bold', [92, 18, 32]);
        $cursorY -= 16;

        if ($drawHeader) {
            $this->drawTableHeader($pages[$pageIndex], self::PDF_MARGIN, $cursorY, $columns);
            $cursorY -= 24;
        }

        $pages[$pageIndex]['cursor_y'] = $cursorY;
    }

    private function drawTableHeader(array &$page, float $x, float $y, array $columns): void
    {
        $totalWidth = array_sum(array_column($columns, 'width'));
        $this->pdfRect($page, $x, $y - 18, $totalWidth, 20, [247, 236, 238], [133, 32, 48], 0.8);

        $cursorX = $x;
        foreach ($columns as $column) {
            $this->pdfLine($page, $cursorX, $y - 18, $cursorX, $y + 2, [224, 219, 213], 0.5);
            $this->pdfText($page, $cursorX + 4, $y - 6, $column['label'], 8.5, 'bold', [92, 18, 32]);
            $cursorX += $column['width'];
        }

        $this->pdfLine($page, $x + $totalWidth, $y - 18, $x + $totalWidth, $y + 2, [224, 219, 213], 0.5);
        $this->pdfLine($page, $x, $y + 2, $x + $totalWidth, $y + 2, [224, 219, 213], 0.5);
    }

    private function drawTableRow(array &$page, float $x, float $y, array $columns, array $row, float $rowHeight, float $fontSize): void
    {
        $totalWidth = array_sum(array_column($columns, 'width'));
        $this->pdfRect($page, $x, $y - $rowHeight, $totalWidth, $rowHeight, [255, 255, 255], [224, 219, 213], 0.5);

        $cursorX = $x;
        foreach ($columns as $columnIndex => $column) {
            $cellText = (string) ($row[$columnIndex] ?? '');
            $wrapped = $this->wrapText($cellText, $column['width'] - 6, $fontSize);
            $lineY = $y - 10;

            foreach ($wrapped as $line) {
                $this->pdfText($page, $cursorX + 3, $lineY, $line, $fontSize, 'regular', [44, 36, 34]);
                $lineY -= ($fontSize + 2);
            }

            $this->pdfLine($page, $cursorX, $y - $rowHeight, $cursorX, $y, [224, 219, 213], 0.4);
            $cursorX += $column['width'];
        }

        $this->pdfLine($page, $x + $totalWidth, $y - $rowHeight, $x + $totalWidth, $y, [224, 219, 213], 0.4);
        $this->pdfLine($page, $x, $y - $rowHeight, $x + $totalWidth, $y - $rowHeight, [224, 219, 213], 0.4);
    }

    private function calculateRowHeight(array $row, array $columns, float $fontSize): float
    {
        $maxLines = 1;

        foreach ($columns as $columnIndex => $column) {
            $lineCount = count($this->wrapText((string) ($row[$columnIndex] ?? ''), $column['width'] - 6, $fontSize));
            $maxLines = max($maxLines, $lineCount);
        }

        return max(20, ($maxLines * ($fontSize + 2)) + 8);
    }

    private function wrapText(string $text, float $width, float $fontSize): array
    {
        $normalized = trim(preg_replace('/\s+/', ' ', $text) ?? '');

        if ($normalized === '') {
            return ['—'];
        }

        $maxChars = max((int) floor($width / max($fontSize * 0.52, 1)), 1);
        $words = explode(' ', $normalized);
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            $candidate = $current === '' ? $word : $current . ' ' . $word;
            if (mb_strlen($candidate) <= $maxChars) {
                $current = $candidate;
                continue;
            }

            if ($current !== '') {
                $lines[] = $current;
            }

            while (mb_strlen($word) > $maxChars) {
                $lines[] = mb_substr($word, 0, $maxChars - 1) . '…';
                $word = mb_substr($word, $maxChars - 1);
            }

            $current = $word;
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines === [] ? ['—'] : $lines;
    }

    private function formatMetadataText(array $entry): string
    {
        $parts = [];

        if (! empty($entry['reference_item_name'])) {
            $parts[] = 'Copied from ' . $entry['reference_item_name'];
        }

        foreach (($entry['metadata'] ?? []) as $label => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $displayValue = is_numeric($value) ? $this->toMoneyString((float) $value) : (string) $value;

            if (in_array($label, ['discount_percentage'], true)) {
                $displayValue = rtrim(rtrim(number_format((float) $value, 2, '.', ''), '0'), '.') . '%';
            }

            $parts[] = ucfirst(str_replace('_', ' ', $label)) . ': ' . $displayValue;
        }

        return implode('; ', $parts);
    }

    private function formatPdfDate(string $value): string
    {
        if ($value === '') {
            return '—';
        }

        return Carbon::parse($value)->format('Y-m-d H:i');
    }

    private function pdfText(array &$page, float $x, float $y, string $text, float $fontSize, string $font, array $rgb): void
    {
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
        $fontName = $font === 'bold' ? 'F2' : 'F1';
        $color = sprintf('%.3F %.3F %.3F rg', $rgb[0] / 255, $rgb[1] / 255, $rgb[2] / 255);
        $page['commands'][] = sprintf("BT\n/%s %.2F Tf\n%s\n1 0 0 1 %.2F %.2F Tm\n(%s) Tj\nET", $fontName, $fontSize, $color, $x, $y, $escaped);
    }

    private function pdfLine(array &$page, float $x1, float $y1, float $x2, float $y2, array $rgb, float $width): void
    {
        $color = sprintf('%.3F %.3F %.3F RG', $rgb[0] / 255, $rgb[1] / 255, $rgb[2] / 255);
        $page['commands'][] = sprintf("q\n%s\n%.2F w\n%.2F %.2F m\n%.2F %.2F l\nS\nQ", $color, $width, $x1, $y1, $x2, $y2);
    }

    private function pdfRect(array &$page, float $x, float $y, float $width, float $height, array $fillRgb, array $strokeRgb, float $lineWidth): void
    {
        $fill = sprintf('%.3F %.3F %.3F rg', $fillRgb[0] / 255, $fillRgb[1] / 255, $fillRgb[2] / 255);
        $stroke = sprintf('%.3F %.3F %.3F RG', $strokeRgb[0] / 255, $strokeRgb[1] / 255, $strokeRgb[2] / 255);
        $page['commands'][] = sprintf("q\n%s\n%s\n%.2F w\n%.2F %.2F %.2F %.2F re\nB\nQ", $fill, $stroke, $lineWidth, $x, $y, $width, $height);
    }

    private function buildPdfDocument(array $pages): string
    {
        $objects = [];
        $pageObjectNumbers = [];
        $contentObjectNumbers = [];
        $fontRegularObject = 3;
        $fontBoldObject = 4;

        $objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
        $objects[2] = '__PAGES__';
        $objects[$fontRegularObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
        $objects[$fontBoldObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

        $nextObject = 5;
        foreach ($pages as $page) {
            $contentObjectNumbers[] = $nextObject;
            $objects[$nextObject] = sprintf("<< /Length %d >>\nstream\n%s\nendstream", strlen(implode("\n", $page['commands'])), implode("\n", $page['commands']));
            $nextObject++;
            $pageObjectNumbers[] = $nextObject;
            $objects[$nextObject] = sprintf(
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> /Contents %d 0 R >>",
                self::PDF_PAGE_WIDTH,
                self::PDF_PAGE_HEIGHT,
                $fontRegularObject,
                $fontBoldObject,
                end($contentObjectNumbers)
            );
            $nextObject++;
        }

        $objects[2] = sprintf('<< /Type /Pages /Kids [%s] /Count %d >>', implode(' ', array_map(fn (int $objectNumber): string => $objectNumber . ' 0 R', $pageObjectNumbers)), count($pageObjectNumbers));
        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $objectNumber => $body) {
            $offsets[$objectNumber] = strlen($pdf);
            $pdf .= sprintf("%d 0 obj\n%s\nendobj\n", $objectNumber, $body);
        }

        $xrefOffset = strlen($pdf);
        $pdf .= sprintf("xref\n0 %d\n", count($objects) + 1);
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i] ?? 0);
        }

        $pdf .= sprintf("trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF", count($objects) + 1, $xrefOffset);

        return $pdf;
    }

    private function slugify(string $value): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? 'sales-report';
        return trim($value, '-') ?: 'sales-report';
    }

    private function toMoneyString(float $value): string
    {
        return number_format($value, 2, '.', '');
    }
}
