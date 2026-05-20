<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BusinessService
{
    public function paginate(): LengthAwarePaginator
    {
        return Business::query()->latest('id')->paginate(15);
    }

    public function store(array $validated): Business
    {
        return Business::query()->create($validated);
    }

    public function update(Business $business, array $validated): Business
    {
        $business->update($validated);

        return $business->refresh();
    }

    public function delete(Business $business): void
    {
        $business->delete();
    }
}
