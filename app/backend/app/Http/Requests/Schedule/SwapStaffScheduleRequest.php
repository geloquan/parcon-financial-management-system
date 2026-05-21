<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SwapStaffScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $business = $this->route('business');
        $businessId = is_object($business) ? $business->id : null;

        return [
            'source_schedule_id' => [
                'required',
                'integer',
                Rule::exists('staff_schedules', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'target_schedule_id' => [
                'required',
                'integer',
                'different:source_schedule_id',
                Rule::exists('staff_schedules', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
        ];
    }
}
