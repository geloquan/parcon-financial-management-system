<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class StoreGcashSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transaction_recipient' => ['required', 'string', 'max:255'],
            'amount_moved' => ['required', 'numeric', 'min:0'],
            'sales_amount' => ['required', 'numeric', 'min:0'],
            'profit_amount' => ['required', 'numeric'],
            'transaction_type' => ['required', 'in:cash_in,cash_out'],
            'transaction_date' => ['required', 'date'],
        ];
    }
}
