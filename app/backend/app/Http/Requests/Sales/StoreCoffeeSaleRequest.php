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
        return [
            'price' => ['required', 'numeric', 'min:0'],
            'coffee_type' => ['required', 'string', 'max:255'],
            'size' => ['required', 'string', 'max:100'],
            'add_ons' => ['nullable', 'string'],
            'sale_date' => ['required', 'date'],
        ];
    }
}
