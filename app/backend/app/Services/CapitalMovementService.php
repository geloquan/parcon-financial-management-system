<?php

namespace App\Services;

use App\Models\Business;
use App\Models\CapitalMovement;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CapitalMovementService
{
    public function paginate(): LengthAwarePaginator
    {
        return CapitalMovement::query()->latest('id')->paginate(20);
    }

    public function storePortfolioMovement(User $user, array $validated): CapitalMovement
    {
        if ($validated['direction'] === 'transfer' && empty($validated['target_business_id'])) {
            throw ValidationException::withMessages([
                'target_business_id' => ['The target_business_id field is required when direction is transfer.'],
            ]);
        }

        if ($validated['direction'] !== 'transfer' && ! empty($validated['target_business_id'])) {
            throw ValidationException::withMessages([
                'target_business_id' => ['The target_business_id field must be empty unless direction is transfer.'],
            ]);
        }

        return CapitalMovement::query()->create([
            'initiated_by_user_id' => $user->id,
            'amount' => $validated['amount'],
            'direction' => $validated['direction'],
            'source_type' => 'portfolio',
            'source_business_id' => null,
            'target_business_id' => $validated['target_business_id'] ?? null,
            'occurred_on' => $validated['occurred_on'],
            'notes' => $validated['notes'] ?? null,
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
}
