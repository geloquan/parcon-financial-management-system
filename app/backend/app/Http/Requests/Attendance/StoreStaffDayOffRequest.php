<?php

namespace App\Http\Requests\Attendance;

use App\Models\StaffAbsence;
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
            'day_off_on' => [
                'required',
                'date',
                Rule::unique('staff_day_offs', 'day_off_on')->where(fn ($query) => $query->where('staff_id', $this->input('staff_id'))),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $hasAbsence = StaffAbsence::query()
                        ->where('staff_id', (int) $this->input('staff_id'))
                        ->whereDate('absent_on', (string) $value)
                        ->exists();

                    if ($hasAbsence) {
                        $fail('The selected date is already marked as absent for this staff.');
                    }
                },
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
