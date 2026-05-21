<?php

namespace App\Services;

use App\Models\Business;
use App\Models\StaffAbsence;
use App\Models\StaffDayOff;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StaffAttendanceService
{
    public function paginateDayOffs(Business $business, ?string $dayOffDate): LengthAwarePaginator
    {
        return StaffDayOff::query()
            ->with('staff:id,full_name')
            ->where('business_id', $business->id)
            ->when($dayOffDate, fn ($query) => $query->whereDate('day_off_date', $dayOffDate))
            ->orderByDesc('day_off_date')
            ->orderByDesc('id')
            ->paginate(15);
    }

    public function storeDayOff(Business $business, array $validated): StaffDayOff
    {
        return StaffDayOff::query()
            ->create([...$validated, 'business_id' => $business->id])
            ->load('staff:id,full_name');
    }

    public function deleteDayOff(StaffDayOff $dayOff): void
    {
        $dayOff->delete();
    }

    public function paginateAbsences(Business $business, ?string $absenceDate): LengthAwarePaginator
    {
        return StaffAbsence::query()
            ->with('staff:id,full_name')
            ->where('business_id', $business->id)
            ->when($absenceDate, fn ($query) => $query->whereDate('absence_date', $absenceDate))
            ->orderByDesc('absence_date')
            ->orderByDesc('id')
            ->paginate(15);
    }

    public function storeAbsence(Business $business, array $validated): StaffAbsence
    {
        return StaffAbsence::query()
            ->create([...$validated, 'business_id' => $business->id])
            ->load('staff:id,full_name');
    }

    public function deleteAbsence(StaffAbsence $absence): void
    {
        $absence->delete();
    }
}
