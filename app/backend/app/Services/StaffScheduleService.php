<?php

namespace App\Services;

use App\Models\Business;
use App\Models\StaffSchedule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

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

    public function swap(Business $business, array $validated): array
    {
        return DB::transaction(function () use ($business, $validated): array {
            $schedules = StaffSchedule::query()
                ->where('business_id', $business->id)
                ->whereIn('id', [$validated['source_schedule_id'], $validated['target_schedule_id']])
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $source = $schedules->get($validated['source_schedule_id']);
            $target = $schedules->get($validated['target_schedule_id']);

            if (! $source || ! $target) {
                abort(404);
            }

            if ($source->staff_id === $target->staff_id) {
                abort(422, 'Schedule swap requires two different staff records.');
            }

            $conflictingSource = StaffSchedule::query()
                ->where('business_id', $business->id)
                ->where('staff_id', $source->staff_id)
                ->whereDate('scheduled_on', $target->scheduled_on)
                ->whereNotIn('id', [$source->id, $target->id])
                ->exists();

            $conflictingTarget = StaffSchedule::query()
                ->where('business_id', $business->id)
                ->where('staff_id', $target->staff_id)
                ->whereDate('scheduled_on', $source->scheduled_on)
                ->whereNotIn('id', [$source->id, $target->id])
                ->exists();

            if ($conflictingSource || $conflictingTarget) {
                abort(422, 'Schedule swap conflicts with existing plotted dates.');
            }

            $sourceDate = $source->scheduled_on->toDateString();
            $targetDate = $target->scheduled_on->toDateString();
            $now = now();

            DB::update(
                'UPDATE staff_schedules
                 SET scheduled_on = CASE id WHEN ? THEN ? WHEN ? THEN ? END,
                     updated_at = ?
                 WHERE id IN (?, ?)',
                [$source->id, $targetDate, $target->id, $sourceDate, $now, $source->id, $target->id]
            );

            return [
                'source' => $source->refresh()->load('staff:id,full_name'),
                'target' => $target->refresh()->load('staff:id,full_name'),
            ];
        });
    }
}
