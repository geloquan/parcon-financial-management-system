<?php

namespace App\Services;

use App\Models\Business;
use App\Models\StaffAbsence;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StaffAbsenceService
{
    public function paginate(Business $business, ?string $absentOn): LengthAwarePaginator
    {
        return StaffAbsence::query()
            ->with('staff:id,full_name')
            ->where('business_id', $business->id)
            ->when($absentOn, fn ($query) => $query->whereDate('absent_on', $absentOn))
            ->orderByDesc('absent_on')
            ->orderByDesc('id')
            ->paginate(15);
    }

    public function store(Business $business, array $validated): StaffAbsence
    {
        return StaffAbsence::query()->create([
            ...$validated,
            'business_id' => $business->id,
        ])->load('staff:id,full_name');
    }

    public function delete(StaffAbsence $absence): void
    {
        $absence->delete();
    }
}
