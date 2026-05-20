<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Staff */
class StaffResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'full_name' => $this->full_name,
            'age' => $this->age,
            'employment_start_date' => $this->employment_start_date?->toDateString(),
            'employment_end_date' => $this->employment_end_date?->toDateString(),
            'employment_type' => $this->employment_type,
            'salary' => $this->salary,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
