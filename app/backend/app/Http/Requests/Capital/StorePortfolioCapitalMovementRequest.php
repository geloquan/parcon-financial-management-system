<?php

namespace App\Http\Requests\Capital;

use Illuminate\Foundation\Http\FormRequest;

class StorePortfolioCapitalMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'owner'], true);
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'direction' => ['required', 'in:add,deduct,transfer'],
            'target_business_id' => ['nullable', 'integer', 'exists:businesses,id'],
            'occurred_on' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'reauth_username' => ['required', 'string'],
            'reauth_password' => ['required', 'string'],
        ];
    }
}
