<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Validation\Rule;

class UpdateStaffScheduleRequest extends StoreStaffScheduleRequest
{
    public function rules(): array
    {
        $business = $this->route('business');
        $businessId = is_object($business) ? $business->id : null;

        return [
            'staff_id' => [
                'sometimes',
                'integer',
                Rule::exists('staff', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'scheduled_on' => ['sometimes', 'date'],
            'attendance_status' => ['sometimes', 'in:pending,present,absent'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
