<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class StorePrintSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_type' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:500'],
            'sales_amount' => ['required', 'numeric', 'min:0'],
            'sale_date' => ['required', 'date'],
        ];
    }
}
