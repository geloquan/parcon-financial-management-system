<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffDayOffRequest extends FormRequest
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
            'staff_id' => [
                'required',
                'integer',
                Rule::exists('staff', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'day_off_date' => ['required', 'date', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
