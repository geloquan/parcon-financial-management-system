<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CapitalMovement;
use App\Models\CompensationRun;
use App\Models\EtherealSale;
use App\Models\Staff;
use App\Models\StaffAbsence;
use App\Models\StaffCashAdvance;
use App\Models\StaffDayOff;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CompensationRunService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return CompensationRun::query()
            ->with('finalizedBy:id,name')
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
            ->get(['id', 'full_name', 'salary', 'commission_rate_percent']);

        $dayOffs = StaffDayOff::query()
            ->where('business_id', $business->id)
            ->whereBetween('day_off_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->get(['staff_id', 'day_off_date']);
        $absences = StaffAbsence::query()
            ->where('business_id', $business->id)
            ->whereBetween('absence_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->get(['staff_id', 'absence_date']);
        $etherealSales = EtherealSale::query()
            ->where('business_id', $business->id)
            ->whereBetween('service_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->get(['staff_id', 'staff_ids', 'net_amount']);

        $cashAdvances = StaffCashAdvance::query()
            ->whereIn('staff_id', $staff->pluck('id'))
            ->where('status', 'pending')
            ->get(['id', 'staff_id', 'remaining_balance']);

        $breakdown = [];
        $grossPay = 0.0;
        $totalDeductions = 0.0;
        $periodDaysCount = max($periodStart->diffInDays($periodEnd) + 1, 0);

        foreach ($staff as $member) {
            $memberDayOffDates = $dayOffs->where('staff_id', $member->id)
                ->pluck('day_off_date')
                ->map(static fn ($date): string => Carbon::parse($date)->toDateString());
            $memberAbsenceDates = $absences->where('staff_id', $member->id)
                ->pluck('absence_date')
                ->map(static fn ($date): string => Carbon::parse($date)->toDateString());
            $dayOffDays = $memberDayOffDates->unique()->count();
            $absentDays = $memberAbsenceDates->unique()->count();
            $unpaidDays = $memberDayOffDates->merge($memberAbsenceDates)->unique()->count();
            $targetDays = $mode === 'by_days'
                ? max((int) ($validated['number_of_days'] ?? 0), 0)
                : $periodDaysCount;
            $payableDays = max($targetDays - min($unpaidDays, $targetDays), 0);
            $presentDays = $payableDays;

            $dailyRate = (float) $member->salary;
            $basePay = round($dailyRate * $payableDays, 2);
            $commissionRatePercent = round((float) $member->commission_rate_percent, 2);
            $commissionableSalesTotal = round((float) $etherealSales
                ->filter(function (EtherealSale $sale) use ($member): bool {
                    $staffIds = collect($sale->staff_ids ?? [$sale->staff_id])
                        ->filter(static fn ($id): bool => is_numeric($id))
                        ->map(static fn ($id): int => (int) $id)
                        ->values()
                        ->all();

                    return in_array($member->id, $staffIds, true);
                })
                ->sum('net_amount'), 2);
            $commissionAmount = round(($commissionableSalesTotal * $commissionRatePercent) / 100, 2);
            $memberGross = round($basePay + $commissionAmount, 2);
            $memberCashAdvances = $cashAdvances->where('staff_id', $member->id);
            $settlements = $memberCashAdvances
                ->map(static fn (StaffCashAdvance $advance): array => [
                    'cash_advance_id' => $advance->id,
                    'deducted_amount' => round((float) $advance->remaining_balance, 2),
                    'remaining_balance_before' => round((float) $advance->remaining_balance, 2),
                ])
                ->values()
                ->all();
            $memberDeduction = round((float) collect($settlements)->sum('deducted_amount'), 2);
            $memberNet = round($memberGross - $memberDeduction, 2);

            $grossPay += $memberGross;
            $totalDeductions += $memberDeduction;

            $breakdown[] = [
                'staff_id' => $member->id,
                'staff_name' => $member->full_name,
                'salary' => $member->salary,
                'day_off_days' => $dayOffDays,
                'absent_days' => $absentDays,
                'present_days' => $presentDays,
                'payable_days' => $payableDays,
                'base_pay' => $basePay,
                'commission_rate_percent' => $commissionRatePercent,
                'commissionable_sales_total' => $commissionableSalesTotal,
                'commission_amount' => $commissionAmount,
                'gross_pay' => $memberGross,
                'deductions' => $memberDeduction,
                'net_pay' => $memberNet,
                'cash_advance_settlements' => $settlements,
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
            'payment_status' => 'pending',
            'payment_history' => [],
        ]);
    }

    public function finalize(CompensationRun $run, User $user): CompensationRun
    {
        return DB::transaction(function () use ($run, $user): CompensationRun {
            $run = CompensationRun::query()
                ->with('finalizedBy:id,name')
                ->lockForUpdate()
                ->findOrFail($run->id);

            if ($run->payment_status === 'finalized') {
                return $run;
            }

            $breakdown = collect($run->employee_breakdown ?? []);
            $settledDeductions = [];

            foreach ($breakdown as $member) {
                $staffId = (int) ($member['staff_id'] ?? 0);
                $staffName = (string) ($member['staff_name'] ?? '');
                $settlements = collect($member['cash_advance_settlements'] ?? []);

                foreach ($settlements as $settlement) {
                    $advanceId = (int) ($settlement['cash_advance_id'] ?? 0);
                    $deductedAmount = round((float) ($settlement['deducted_amount'] ?? 0), 2);

                    if ($advanceId <= 0 || $deductedAmount <= 0) {
                        continue;
                    }

                    $advance = StaffCashAdvance::query()
                        ->whereKey($advanceId)
                        ->whereHas('staff', fn ($query) => $query->where('business_id', $run->business_id))
                        ->lockForUpdate()
                        ->first();

                    if (! $advance) {
                        continue;
                    }

                    $remainingBefore = round((float) $advance->remaining_balance, 2);
                    $settledAmount = min($remainingBefore, $deductedAmount);
                    $remainingAfter = round(max($remainingBefore - $settledAmount, 0), 2);

                    $advance->update([
                        'remaining_balance' => $remainingAfter,
                        'status' => $remainingAfter <= 0 ? 'settled' : 'pending',
                    ]);

                    $settledDeductions[] = [
                        'staff_id' => $staffId,
                        'staff_name' => $staffName,
                        'cash_advance_id' => $advance->id,
                        'deducted_amount' => $deductedAmount,
                        'settled_amount' => $settledAmount,
                        'remaining_balance_before' => $remainingBefore,
                        'remaining_balance_after' => $remainingAfter,
                        'status' => $advance->status,
                    ];
                }
            }

            $history = $run->payment_history ?? [];
            $history[] = [
                'action' => 'finalized',
                'finalized_at' => now()->toIso8601String(),
                'finalized_by_user_id' => $user->id,
                'finalized_by_name' => $user->name,
                'settled_deductions' => $settledDeductions,
            ];

            $run->update([
                'payment_status' => 'finalized',
                'finalized_by_user_id' => $user->id,
                'finalized_at' => now(),
                'payment_history' => $history,
            ]);

            if ((float) $run->net_pay > 0) {
                CapitalMovement::query()->create([
                    'initiated_by_user_id' => $user->id,
                    'amount' => $run->net_pay,
                    'direction' => 'deduct',
                    'source_type' => 'portfolio',
                    'source_business_id' => null,
                    'target_business_id' => $run->business_id,
                    'occurred_on' => now()->toDateString(),
                    'notes' => sprintf(
                        'Payroll payout for compensation run #%d (%s to %s).',
                        $run->id,
                        $run->period_start?->toDateString() ?? '',
                        $run->period_end?->toDateString() ?? ''
                    ),
                ]);
            }

            return $run->refresh()->load('finalizedBy:id,name');
        });
    }

    public function delete(CompensationRun $run): void
    {
        $run->delete();
    }
}
