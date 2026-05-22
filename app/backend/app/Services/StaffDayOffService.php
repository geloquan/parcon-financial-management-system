<?php

namespace App\Services;

use App\Models\Business;
use App\Models\StaffDayOff;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StaffDayOffService
{
    public function paginate(Business $business, ?string $dayOffOn): LengthAwarePaginator
    {
        return StaffDayOff::query()
            ->with('staff:id,full_name')
            ->where('business_id', $business->id)
            ->when($dayOffOn, fn ($query) => $query->whereDate('day_off_on', $dayOffOn))
            ->orderByDesc('day_off_on')
            ->orderByDesc('id')
            ->paginate(15);
    }

    public function store(Business $business, array $validated): StaffDayOff
    {
        return StaffDayOff::query()->create([
            ...$validated,
            'business_id' => $business->id,
        ])->load('staff:id,full_name');
    }

    public function delete(StaffDayOff $dayOff): void
    {
        $dayOff->delete();
    }
}
