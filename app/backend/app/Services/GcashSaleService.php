<?php

namespace App\Services;

use App\Models\Business;
use App\Models\GcashSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GcashSaleService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return GcashSale::query()->where('business_id', $business->id)->latest('id')->paginate(15);
    }

    public function store(Business $business, array $validated): GcashSale
    {
        $profitAmount = round($validated['sales_amount'] - $validated['amount_moved'], 2);
        $isDebt = (bool) ($validated['is_debt'] ?? false);
        $chargedAmount = array_key_exists('charged_amount', $validated)
            ? $validated['charged_amount']
            : null;

        if ($chargedAmount === null && ! $isDebt) {
            $chargedAmount = $validated['sales_amount'];
        }

        return GcashSale::query()->create([
            ...$validated,
            'business_id' => $business->id,
            'profit_amount' => $profitAmount,
            'is_debt' => $isDebt,
            'charged_amount' => $chargedAmount,
        ]);
    }

    public function update(GcashSale $sale, array $validated): GcashSale
    {
        $profitAmount = round($validated['sales_amount'] - $validated['amount_moved'], 2);
        $isDebt = (bool) ($validated['is_debt'] ?? false);
        $chargedAmount = array_key_exists('charged_amount', $validated)
            ? $validated['charged_amount']
            : null;

        if ($chargedAmount === null && ! $isDebt) {
            $chargedAmount = $validated['sales_amount'];
        }

        $sale->update([
            ...$validated,
            'profit_amount' => $profitAmount,
            'is_debt' => $isDebt,
            'charged_amount' => $chargedAmount,
        ]);

        return $sale->refresh();
    }

    public function delete(GcashSale $sale): void
    {
        $sale->delete();
    }
}
