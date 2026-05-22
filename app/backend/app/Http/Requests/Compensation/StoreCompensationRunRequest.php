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
            'computation_mode' => ['required', 'in:today,specific_date'],
            'cutoff_date' => ['nullable', 'date', 'before_or_equal:today', 'required_if:computation_mode,specific_date'],
        ];
    }
}
