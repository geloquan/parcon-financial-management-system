<?php

namespace App\Services;

use App\Models\Business;
use App\Models\EtherealSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EtherealSaleService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return EtherealSale::query()->where('business_id', $business->id)->latest('id')->paginate(15);
    }

    public function store(Business $business, array $validated): EtherealSale
    {
        $cashDiscount = round(($validated['service_cost'] * $validated['discount_percentage']) / 100, 2);
        $netAmount = round($validated['service_cost'] - $cashDiscount, 2);

        return EtherealSale::query()->create([
            ...$validated,
            'business_id' => $business->id,
            'cash_discount' => $cashDiscount,
            'net_amount' => $netAmount,
        ]);
    }

    public function update(EtherealSale $sale, array $validated): EtherealSale
    {
        $cashDiscount = round(($validated['service_cost'] * $validated['discount_percentage']) / 100, 2);
        $netAmount = round($validated['service_cost'] - $cashDiscount, 2);

        $sale->update([
            ...$validated,
            'cash_discount' => $cashDiscount,
            'net_amount' => $netAmount,
        ]);

        return $sale->refresh();
    }

    public function delete(EtherealSale $sale): void
    {
        $sale->delete();
    }
}
