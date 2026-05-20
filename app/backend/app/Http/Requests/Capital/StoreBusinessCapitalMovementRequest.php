<?php

namespace App\Http\Requests\Capital;

use Illuminate\Foundation\Http\FormRequest;

class StoreBusinessCapitalMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'owner']) ?? false;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'direction' => ['required', 'in:add,deduct'],
            'occurred_on' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
