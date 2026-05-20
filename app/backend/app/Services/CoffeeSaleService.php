<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CoffeeSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CoffeeSaleService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return CoffeeSale::query()->where('business_id', $business->id)->latest('id')->paginate(15);
    }

    public function store(Business $business, array $validated): CoffeeSale
    {
        return CoffeeSale::query()->create([...$validated, 'business_id' => $business->id]);
    }

    public function update(CoffeeSale $sale, array $validated): CoffeeSale
    {
        $sale->update($validated);

        return $sale->refresh();
    }

    public function delete(CoffeeSale $sale): void
    {
        $sale->delete();
    }
}
