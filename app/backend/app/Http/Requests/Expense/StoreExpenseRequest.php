<?php

namespace App\Http\Requests\Expense;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    use HasMoneyReauthRules;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $dateIssuedRules = ['required', 'date', 'before_or_equal:now'];

        if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
            $dateIssuedRules[] = 'after_or_equal:today';
        }

        return [
            'date_issued' => $dateIssuedRules,
            'amount' => ['required', 'numeric', 'min:0'],
            'description' => ['required', 'string', 'max:500'],
            'purpose' => ['required', 'in:business,business_portfolio,service'],
            'recurrence_reference' => ['nullable', 'string', 'max:255'],
            'proof' => ['nullable', 'image', 'max:1024'],
            ...$this->moneyReauthRules(),
        ];
    }
}
