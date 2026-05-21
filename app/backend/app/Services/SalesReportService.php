<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CoffeeSale;
use App\Models\EtherealSale;
use App\Models\GcashSale;
use App\Models\PrintSale;
<<<<<<< HEAD
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class SalesReportService
{
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
=======
use App\Models\SalesReportVersion;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class SalesReportService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return SalesReportVersion::query()
            ->where('business_id', $business->id)
            ->latest('id')
            ->paginate(10);
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

        return SalesReportVersion::query()->create([
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
                'business_name' => $business->name,
            ],
            'details' => $details,
        ]);
    }

    public function download(Business $business, SalesReportVersion $report): array
    {
        $filename = sprintf('%s-sales-report-v%s.pdf', $business->slug, $report->version);
        $pdf = $this->generatePdf($report);

        return ['filename' => $filename, 'content' => $pdf];
    }

    private function collectDetails(Business $business, Carbon $startDate, Carbon $endDate): array
    {
        $gcash = GcashSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->get(['sales_amount', 'profit_amount']);
        $coffee = CoffeeSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->get(['price']);
        $print = PrintSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->get(['sales_amount']);
        $ethereal = EtherealSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('service_date', [$startDate, $endDate])
            ->get(['net_amount']);

        return [
            'range' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'totals' => [
                'gcash_sales' => round((float) $gcash->sum('sales_amount'), 2),
                'gcash_profit' => round((float) $gcash->sum('profit_amount'), 2),
                'coffee_sales' => round((float) $coffee->sum('price'), 2),
                'print_sales' => round((float) $print->sum('sales_amount'), 2),
                'ethereal_sales' => round((float) $ethereal->sum('net_amount'), 2),
                'overall_sales' => round((float) $gcash->sum('sales_amount') + (float) $coffee->sum('price') + (float) $print->sum('sales_amount') + (float) $ethereal->sum('net_amount'), 2),
            ],
            'counts' => [
                'gcash_entries' => $gcash->count(),
                'coffee_entries' => $coffee->count(),
                'print_entries' => $print->count(),
                'ethereal_entries' => $ethereal->count(),
>>>>>>> 058db3e201d9d830ad5c53749dcbc385f875a7c8
            ],
        ];
    }

<<<<<<< HEAD
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

    private function toMoneyString(float $value): string
    {
        return number_format($value, 2, '.', '');
=======
    private function generatePdf(SalesReportVersion $report): string
    {
        $metadata = $report->metadata ?? [];
        $details = $report->details ?? [];
        $totals = $details['totals'] ?? [];
        $counts = $details['counts'] ?? [];

        $lines = [
            $report->document_title,
            sprintf('Business: %s', $metadata['business_name'] ?? 'N/A'),
            sprintf('Version: %s', $report->version),
            sprintf('Date Range: %s to %s', $report->start_date?->toDateString(), $report->end_date?->toDateString()),
            sprintf('Generated At: %s', $metadata['generated_at'] ?? ''),
            sprintf('Generated By: %s', $metadata['generated_by'] ?? ''),
            '--- Report Details ---',
            sprintf('GCash Sales: %.2f', (float) ($totals['gcash_sales'] ?? 0)),
            sprintf('GCash Profit: %.2f', (float) ($totals['gcash_profit'] ?? 0)),
            sprintf('Coffee Sales: %.2f', (float) ($totals['coffee_sales'] ?? 0)),
            sprintf('Print Sales: %.2f', (float) ($totals['print_sales'] ?? 0)),
            sprintf('Ethereal Sales: %.2f', (float) ($totals['ethereal_sales'] ?? 0)),
            sprintf('Overall Sales: %.2f', (float) ($totals['overall_sales'] ?? 0)),
            sprintf('Entry Counts (G/C/P/E): %d / %d / %d / %d', (int) ($counts['gcash_entries'] ?? 0), (int) ($counts['coffee_entries'] ?? 0), (int) ($counts['print_entries'] ?? 0), (int) ($counts['ethereal_entries'] ?? 0)),
            sprintf('Footer Metadata: format=%s size=%s', $report->document_format, $metadata['page_size'] ?? '8.5x13in'),
        ];

        return $this->buildSimplePdf($lines);
    }

    private function buildSimplePdf(array $lines): string
    {
        $escapedLines = array_map(fn (string $line): string => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line), $lines);

        $stream = "BT\n/F1 11 Tf\n50 900 Td\n15 TL\n";

        foreach ($escapedLines as $line) {
            $stream .= sprintf('(%s) Tj T*\n', $line);
        }

        $stream .= 'ET';

        $objects = [];
        $objects[] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        $objects[] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        $objects[] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 936] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n";
        $objects[] = sprintf("4 0 obj\n<< /Length %d >>\nstream\n%s\nendstream\nendobj\n", strlen($stream), $stream);
        $objects[] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
>>>>>>> 058db3e201d9d830ad5c53749dcbc385f875a7c8
    }
}
