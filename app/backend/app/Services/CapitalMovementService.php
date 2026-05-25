<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CapitalMovement;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class CapitalMovementService
{
    public function paginate(): LengthAwarePaginator
    {
        return CapitalMovement::query()->latest('id')->paginate(20);
    }

    public function getBusinessBalance(Business $business): float
    {
        // Inflows: portfolio transfers to this business
        $transfers = (float) CapitalMovement::query()
            ->where('source_type', 'portfolio')
            ->where('direction', 'transfer')
            ->where('target_business_id', $business->id)
            ->sum('amount');

        // Inflows: direct adds recorded against this business
        $directAdds = (float) CapitalMovement::query()
            ->where('source_type', 'business')
            ->where('source_business_id', $business->id)
            ->where('direction', 'add')
            ->sum('amount');

        // Outflows: deductions recorded against this business
        $deductions = (float) CapitalMovement::query()
            ->where('source_type', 'business')
            ->where('source_business_id', $business->id)
            ->where('direction', 'deduct')
            ->sum('amount');

        return round($transfers + $directAdds - $deductions, 2);
    }

    public function storePortfolioMovement(User $user, array $validated): CapitalMovement
    {
        $direction = $validated['direction'];

        if ($direction === 'transfer' && empty($validated['target_business_id'])) {
            throw ValidationException::withMessages([
                'target_business_id' => ['The target_business_id field is required when direction is transfer.'],
            ]);
        }

        if ($direction !== 'transfer' && ! empty($validated['target_business_id'])) {
            throw ValidationException::withMessages([
                'target_business_id' => ['The target_business_id field must be empty unless direction is transfer.'],
            ]);
        }

        $debtStatus = $direction === 'debt' ? 'outstanding' : null;

        return CapitalMovement::query()->create([
            'initiated_by_user_id' => $user->id,
            'amount' => $validated['amount'],
            'direction' => $direction,
            'source_type' => 'portfolio',
            'source_business_id' => null,
            'target_business_id' => $validated['target_business_id'] ?? null,
            'occurred_on' => $validated['occurred_on'],
            'notes' => $validated['notes'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'debt_status' => $debtStatus,
        ]);
    }

    public function storeBusinessMovement(User $user, Business $business, array $validated): CapitalMovement
    {
        if ($validated['direction'] === 'add') {
            return CapitalMovement::query()->create([
                'initiated_by_user_id' => $user->id,
                'amount' => $validated['amount'],
                'direction' => 'add',
                'source_type' => 'business',
                'source_business_id' => $business->id,
                'target_business_id' => null,
                'occurred_on' => $validated['occurred_on'],
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        return CapitalMovement::query()->create([
            'initiated_by_user_id' => $user->id,
            'amount' => $validated['amount'],
            'direction' => 'deduct',
            'source_type' => 'business',
            'source_business_id' => $business->id,
            'target_business_id' => null,
            'occurred_on' => $validated['occurred_on'],
            'notes' => $validated['notes'] ?? null,
        ]);
    }

    public function settleDebt(CapitalMovement $movement, User $user): CapitalMovement
    {
        if ($movement->direction !== 'debt') {
            throw ValidationException::withMessages([
                'movement' => ['Only debt records can be settled.'],
            ]);
        }

        if ($movement->debt_status === 'settled') {
            throw ValidationException::withMessages([
                'movement' => ['This debt record has already been settled.'],
            ]);
        }

        $movement->update([
            'debt_status' => 'settled',
            'settled_at' => now(),
            'settled_by_user_id' => $user->id,
        ]);

        return $movement->refresh();
    }
}
