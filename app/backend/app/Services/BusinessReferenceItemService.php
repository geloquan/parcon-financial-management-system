<?php

namespace App\Services;

use App\Models\Business;
use App\Models\BusinessReferenceItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BusinessReferenceItemService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return BusinessReferenceItem::query()
            ->where('business_id', $business->id)
            ->latest('id')
            ->paginate(30);
    }

    public function store(Business $business, array $validated): BusinessReferenceItem
    {
        return BusinessReferenceItem::query()->create([
            ...$validated,
            'business_id' => $business->id,
        ]);
    }

    public function update(BusinessReferenceItem $item, array $validated): BusinessReferenceItem
    {
        $item->update($validated);

        return $item->refresh();
    }

    public function delete(BusinessReferenceItem $item): void
    {
        $item->delete();
    }
}
