<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CompensationRun;
use App\Models\Staff;
use App\Models\StaffCashAdvance;
use App\Models\StaffSchedule;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class CompensationRunService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return CompensationRun::query()
            ->where('business_id', $business->id)
            ->latest('id')
            ->paginate(15);
    }

    public function store(Business $business, User $user, array $validated): CompensationRun
    {
        $cutoffDate = Carbon::parse($validated['cutoff_date'])->startOfDay();
        $mode = $validated['computation_mode'];

        if ($mode === 'by_days') {
            $days = (int) ($validated['number_of_days'] ?? 1);
            $periodStart = $cutoffDate->copy()->subDays($days - 1);
            $periodEnd = $cutoffDate->copy();
        } else {
            $lastRun = CompensationRun::query()
                ->where('business_id', $business->id)
                ->latest('period_end')
                ->first();

            $periodStart = $lastRun ? Carbon::parse($lastRun->period_end)->addDay()->startOfDay() : $cutoffDate->copy()->startOfMonth();
            $periodEnd = $cutoffDate->copy();
            $days = null;
        }

        $staff = Staff::query()
            ->where('business_id', $business->id)
            ->where('is_active', true)
            ->get(['id', 'full_name', 'salary']);

        $schedules = StaffSchedule::query()
            ->where('business_id', $business->id)
            ->whereBetween('scheduled_on', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->get(['staff_id', 'attendance_status']);

        $cashAdvances = StaffCashAdvance::query()
            ->whereIn('staff_id', $staff->pluck('id'))
            ->where('status', 'pending')
            ->get(['staff_id', 'remaining_balance']);

        $breakdown = [];
        $grossPay = 0.0;
        $totalDeductions = 0.0;

        foreach ($staff as $member) {
            $memberSchedules = $schedules->where('staff_id', $member->id);
            $presentDays = $memberSchedules->where('attendance_status', '!=', 'absent')->count();
            $payableDays = $mode === 'by_days'
                ? max(min($presentDays, (int) ($validated['number_of_days'] ?? 0)), 0)
                : $presentDays;

            $dailyRate = ((float) $member->salary) / 30;
            $memberGross = round($dailyRate * $payableDays, 2);
            $memberDeduction = round((float) $cashAdvances->where('staff_id', $member->id)->sum('remaining_balance'), 2);
            $memberNet = round($memberGross - $memberDeduction, 2);

            $grossPay += $memberGross;
            $totalDeductions += $memberDeduction;

            $breakdown[] = [
                'staff_id' => $member->id,
                'staff_name' => $member->full_name,
                'salary' => $member->salary,
                'present_days' => $presentDays,
                'payable_days' => $payableDays,
                'gross_pay' => $memberGross,
                'deductions' => $memberDeduction,
                'net_pay' => $memberNet,
            ];
        }

        return CompensationRun::query()->create([
            'business_id' => $business->id,
            'computed_by_user_id' => $user->id,
            'computation_mode' => $mode,
            'number_of_days' => $days,
            'cutoff_date' => $cutoffDate->toDateString(),
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'gross_pay' => round($grossPay, 2),
            'total_deductions' => round($totalDeductions, 2),
            'net_pay' => round($grossPay - $totalDeductions, 2),
            'employee_breakdown' => $breakdown,
        ]);
    }

    public function delete(CompensationRun $run): void
    {
        $run->delete();
    }
}
