<?php

namespace App\Http\Requests\Capital;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePortfolioCapitalMovementRequest extends FormRequest
{
    use HasMoneyReauthRules;

    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'owner']) ?? false;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'direction' => ['required', 'in:add,deduct,transfer,debt'],
            'target_business_id' => ['nullable', 'integer', 'exists:businesses,id'],
            'occurred_on' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'required_if:direction,add,deduct'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            ...$this->moneyReauthRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($this->input('direction') === 'debt' && trim((string) $this->input('remarks', '')) === '') {
                $v->errors()->add('remarks', 'The remarks field is required for debt records.');
            }
        });
    }
}
