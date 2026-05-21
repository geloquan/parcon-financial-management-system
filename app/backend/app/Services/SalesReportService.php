<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CoffeeSale;
use App\Models\EtherealSale;
use App\Models\GcashSale;
use App\Models\PrintSale;
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
            ],
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

    private function toMoneyString(float $value): string
    {
        return number_format($value, 2, '.', '');
    }
}
