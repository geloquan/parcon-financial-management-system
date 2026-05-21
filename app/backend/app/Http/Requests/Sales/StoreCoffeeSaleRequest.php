<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class StoreCoffeeSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $saleDateRules = ['required', 'date', 'before_or_equal:now'];

        if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
            $saleDateRules[] = 'after_or_equal:today';
        }

        return [
            'price' => ['required', 'numeric', 'min:0'],
            'coffee_type' => ['required', 'string', 'max:255'],
            'size' => ['required', 'in:8oz,9oz,12oz,16oz,18oz'],
            'add_on_price' => ['required', 'numeric', 'min:0'],
            'add_on_description' => ['nullable', 'string', 'max:500'],
            'sale_date' => $saleDateRules,
        ];
    }
}
