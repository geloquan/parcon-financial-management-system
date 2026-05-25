<?php

namespace App\Services;

use App\Models\Business;
use App\Models\EtherealSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EtherealSaleService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return EtherealSale::query()->where('business_id', $business->id)->latest('id')->paginate(15);
    }

    public function store(Business $business, array $validated): EtherealSale
    {
        return EtherealSale::query()->create([
            ...$this->normalizePayload($validated),
            'business_id' => $business->id,
        ]);
    }

    public function storeMany(Business $business, array $validated): Collection
    {
        $entries = $validated['entries'] ?? [];

        return collect($entries)->map(
            fn (array $entry): EtherealSale => EtherealSale::query()->create([
                ...$this->normalizePayload($entry),
                'business_id' => $business->id,
            ])
        );
    }

    public function update(EtherealSale $sale, array $validated): EtherealSale
    {
        $sale->update($this->normalizePayload($validated));

        return $sale->refresh();
    }

    public function delete(EtherealSale $sale): void
    {
        $sale->delete();
    }

    private function normalizePayload(array $validated): array
    {
        $staffIds = array_values(array_unique(array_filter($validated['staff_ids'] ?? [])));
        $primaryStaffId = $staffIds[0] ?? ($validated['staff_id'] ?? null);
        $cashDiscount = round(($validated['service_cost'] * $validated['discount_percentage']) / 100, 2);
        $netAmount = round($validated['service_cost'] - $cashDiscount, 2);
        $isDebt = (bool) ($validated['is_debt'] ?? false);
        $chargedAmount = array_key_exists('charged_amount', $validated)
            ? $validated['charged_amount']
            : null;

        if ($chargedAmount === null && ! $isDebt) {
            $chargedAmount = $netAmount;
        }

        return [
            ...$validated,
            'staff_id' => $primaryStaffId,
            'staff_ids' => $staffIds,
            'cash_discount' => $cashDiscount,
            'net_amount' => $netAmount,
            'is_debt' => $isDebt,
            'charged_amount' => $chargedAmount,
        ];
    }
}
