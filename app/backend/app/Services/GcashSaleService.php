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
        return GcashSale::query()->create([...$validated, 'business_id' => $business->id]);
    }

    public function update(GcashSale $sale, array $validated): GcashSale
    {
        $sale->update($validated);

        return $sale->refresh();
    }

    public function delete(GcashSale $sale): void
    {
        $sale->delete();
    }
}
