<?php

namespace App\Services;

use App\Models\Business;
use App\Models\PrintSale;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PrintSaleService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return PrintSale::query()->where('business_id', $business->id)->latest('id')->paginate(15);
    }

    public function store(Business $business, array $validated): PrintSale
    {
        return PrintSale::query()->create([
            ...$this->normalizePayload($validated),
            'business_id' => $business->id,
        ]);
    }

    public function storeMany(Business $business, array $validated): Collection
    {
        $entries = $validated['entries'] ?? [];

        return collect($entries)->map(
            fn (array $entry): PrintSale => PrintSale::query()->create([
                ...$this->normalizePayload($entry),
                'business_id' => $business->id,
            ])
        );
    }

    public function update(PrintSale $sale, array $validated): PrintSale
    {
        $sale->update($this->normalizePayload($validated));

        return $sale->refresh();
    }

    public function delete(PrintSale $sale): void
    {
        $sale->delete();
    }

    private function normalizePayload(array $payload): array
    {
        $isDebt = (bool) ($payload['is_debt'] ?? false);
        $chargedAmount = array_key_exists('charged_amount', $payload)
            ? $payload['charged_amount']
            : null;

        if ($chargedAmount === null && ! $isDebt) {
            $chargedAmount = $payload['sales_amount'] ?? 0;
        }

        return [
            ...$payload,
            'is_debt' => $isDebt,
            'charged_amount' => $chargedAmount,
        ];
    }
}
