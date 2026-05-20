<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_issued' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
            'description' => ['required', 'string', 'max:500'],
            'purpose' => ['required', 'in:business,business_portfolio,service'],
            'payment_type' => ['required', 'in:one_time,repeat'],
            'recurrence_reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
