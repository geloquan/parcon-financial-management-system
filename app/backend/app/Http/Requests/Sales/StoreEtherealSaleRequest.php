<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class StoreEtherealSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $serviceDateRules = ['required', 'date', 'before_or_equal:now'];

        if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
            $serviceDateRules[] = 'after_or_equal:today';
        }

        return [
            'staff_id' => ['required', 'integer', 'exists:staff,id'],
            'service_cost' => ['required', 'numeric', 'min:0'],
            'discount_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'discount_type' => ['required', 'string', 'max:100'],
            'service_date' => $serviceDateRules,
        ];
    }
}
