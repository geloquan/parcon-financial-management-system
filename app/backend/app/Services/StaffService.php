<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Staff;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StaffService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return Staff::query()
            ->where('business_id', $business->id)
            ->latest('id')
            ->paginate(15);
    }

    public function store(Business $business, array $validated): Staff
    {
        return Staff::query()->create([...$validated, 'business_id' => $business->id]);
    }

    public function update(Staff $staff, array $validated): Staff
    {
        $staff->update($validated);

        return $staff->refresh();
    }

    public function delete(Staff $staff): void
    {
        $staff->delete();
    }
}
