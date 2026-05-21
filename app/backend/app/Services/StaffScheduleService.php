<?php

namespace App\Services;

use App\Models\Business;
use App\Models\StaffSchedule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StaffScheduleService
{
    public function paginate(Business $business, ?string $scheduledOn): LengthAwarePaginator
    {
        return StaffSchedule::query()
            ->with('staff:id,full_name')
            ->where('business_id', $business->id)
            ->when($scheduledOn, fn ($query) => $query->whereDate('scheduled_on', $scheduledOn))
            ->orderByDesc('scheduled_on')
            ->orderByDesc('id')
            ->paginate(15);
    }

    public function store(Business $business, array $validated): StaffSchedule
    {
        $validated['business_id'] = $business->id;

        if ($validated['attendance_status'] !== 'pending') {
            $validated['attendance_marked_at'] = now();
        }

        return StaffSchedule::query()->create($validated)->load('staff:id,full_name');
    }

    public function update(StaffSchedule $schedule, array $validated): StaffSchedule
    {
        if (($validated['attendance_status'] ?? $schedule->attendance_status) !== 'pending') {
            $validated['attendance_marked_at'] = now();
        } elseif (array_key_exists('attendance_status', $validated)) {
            $validated['attendance_marked_at'] = null;
        }

        $schedule->update($validated);

        return $schedule->refresh()->load('staff:id,full_name');
    }

    public function delete(StaffSchedule $schedule): void
    {
        $schedule->delete();
    }
}
