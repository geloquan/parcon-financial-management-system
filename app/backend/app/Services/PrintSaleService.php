<?php

namespace App\Services;

use App\Models\Business;
use App\Models\PrintSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PrintSaleService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return PrintSale::query()->where('business_id', $business->id)->latest('id')->paginate(15);
    }

    public function store(Business $business, array $validated): PrintSale
    {
        return PrintSale::query()->create([...$validated, 'business_id' => $business->id]);
    }

    public function update(PrintSale $sale, array $validated): PrintSale
    {
        $sale->update($validated);

        return $sale->refresh();
    }

    public function delete(PrintSale $sale): void
    {
        $sale->delete();
    }
}
