<?php

namespace App\Http\Requests\Compensation;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompensationRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'computation_mode' => ['required', 'in:by_days,up_to_date'],
            'number_of_days' => ['nullable', 'integer', 'min:1', 'required_if:computation_mode,by_days'],
            'cutoff_date' => ['required', 'date', 'before_or_equal:today'],
        ];
    }
}
