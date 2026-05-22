<?php

namespace App\Http\Requests\Compensation;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Illuminate\Foundation\Http\FormRequest;

class FinalizeCompensationRunRequest extends FormRequest
{
    use HasMoneyReauthRules;

    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'owner']) ?? false;
    }

    public function rules(): array
    {
        return $this->moneyReauthRules();
    }
}
