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
        $saleDateRules = ['required', 'date', 'before_or_equal:now'];

        if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
            $saleDateRules[] = 'after_or_equal:today';
        }

        return [
            'job_type' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:500'],
            'color_mode' => ['required', 'in:black,white'],
            'print_size' => ['required', 'string', 'max:100'],
            'paper_count' => ['required', 'integer', 'min:1'],
            'sales_amount' => ['required', 'numeric', 'min:0'],
            'sale_date' => $saleDateRules,
        ];
    }
}
