<?php

namespace App\Http\Requests\Sales;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreGcashSaleRequest extends FormRequest
{
    use HasMoneyReauthRules;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $transactionDateRules = ['required', 'date', 'before_or_equal:now'];

        if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
            $transactionDateRules[] = 'after_or_equal:today';
        }

        return [
            'transaction_recipient' => ['nullable', 'string', 'max:255'],
            'reference_item_name' => ['nullable', 'string', 'max:255'],
            'reference_item_original_price' => ['nullable', 'numeric', 'min:0'],
            'amount_moved' => ['required', 'numeric', 'min:0', 'lt:sales_amount'],
            'sales_amount' => ['required', 'numeric', 'min:0.01'],
            'transaction_type' => ['required', 'in:cash_in,cash_out'],
            'transaction_date' => $transactionDateRules,
            ...$this->moneyReauthRules(),
        ];
    }
}
