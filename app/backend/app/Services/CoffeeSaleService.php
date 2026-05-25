<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CoffeeSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CoffeeSaleService
{
  public function paginate(Business $business): LengthAwarePaginator
  {
    return CoffeeSale::query()->where('business_id', $business->id)->latest('id')->paginate(15);
  }

  public function store(Business $business, array $validated): CoffeeSale
  {
    return CoffeeSale::query()->create([
      ...$this->normalizePayload($validated),
      'business_id' => $business->id,
    ]);
  }

  public function storeMany(Business $business, array $validated): Collection
  {
    $entries = $validated['entries'] ?? [];

    return collect($entries)->map(
      fn(array $entry): CoffeeSale => CoffeeSale::query()->create([
        ...$this->normalizePayload($entry),
        'business_id' => $business->id,
      ])
    );
  }

  public function update(CoffeeSale $sale, array $validated): CoffeeSale
  {
    $sale->update($this->normalizePayload($validated));

    return $sale->refresh();
  }

  public function delete(CoffeeSale $sale): void
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
      $chargedAmount = round(((float) ($payload['price'] ?? 0)) + ((float) ($payload['add_on_price'] ?? 0)), 2);
    }

    return [
      ...$payload,
      'is_debt' => $isDebt,
      'charged_amount' => $chargedAmount,
    ];
  }
}
