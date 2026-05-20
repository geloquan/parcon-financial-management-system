<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Expense;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ExpenseService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return Expense::query()
            ->where('business_id', $business->id)
            ->latest('id')
            ->paginate(15);
    }

    public function store(Business $business, array $validated): Expense
    {
        return Expense::query()->create([...$validated, 'business_id' => $business->id]);
    }

    public function update(Expense $expense, array $validated): Expense
    {
        $expense->update($validated);

        return $expense->refresh();
    }

    public function delete(Expense $expense): void
    {
        $expense->delete();
    }
}
