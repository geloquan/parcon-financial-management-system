<?php

namespace App\Http\Requests\Capital;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Illuminate\Foundation\Http\FormRequest;

class SettlePortfolioDebtRequest extends FormRequest
{
    use HasMoneyReauthRules;

    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'owner']) ?? false;
    }

    public function rules(): array
    {
        return [
            ...$this->moneyReauthRules(),
        ];
    }
}
