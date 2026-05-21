<?php

namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'age' => ['sometimes', 'integer', 'min:16', 'max:100'],
            'employment_start_date' => ['sometimes', 'date'],
            'employment_end_date' => ['nullable', 'date', 'after_or_equal:employment_start_date'],
            'employment_type' => ['sometimes', 'string', 'max:100'],
            'salary' => ['sometimes', 'numeric', 'min:0'],
            'commission_rate_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
