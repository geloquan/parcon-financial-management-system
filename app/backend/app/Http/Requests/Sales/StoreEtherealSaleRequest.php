<?php

namespace App\Http\Requests\Sales;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEtherealSaleRequest extends FormRequest
{
    use HasMoneyReauthRules;

    protected function prepareForValidation(): void
    {
        if ($this->has('staff_id') && ! $this->has('staff_ids')) {
            $this->merge([
                'staff_ids' => [$this->input('staff_id')],
            ]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $business = $this->route('business');
        $businessId = is_object($business) ? $business->id : null;
        $serviceDateRules = ['required', 'date', 'before_or_equal:now'];

        if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
            $serviceDateRules[] = 'after_or_equal:today';
        }

        return [
            'entries' => ['nullable', 'array', 'min:1'],
            'entries.*.staff_ids' => ['required_with:entries', 'array', 'min:1'],
            'entries.*.staff_ids.*' => [
                'integer',
                Rule::exists('staff', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'entries.*.service_cost' => ['required_with:entries', 'numeric', 'min:0'],
            'entries.*.discount_percentage' => ['required_with:entries', 'numeric', 'min:0', 'max:100'],
            'entries.*.customer_name' => ['nullable', 'string', 'max:255'],
            'entries.*.discount_type' => ['required_with:entries', 'string', 'max:100'],
            'entries.*.service_date' => $serviceDateRules,
            'staff_ids' => ['required_without:entries', 'array', 'min:1'],
            'staff_ids.*' => [
                'integer',
                Rule::exists('staff', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'staff_id' => ['nullable', 'integer', Rule::exists('staff', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'service_cost' => ['required_without:entries', 'numeric', 'min:0'],
            'discount_percentage' => ['required_without:entries', 'numeric', 'min:0', 'max:100'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'discount_type' => ['required_without:entries', 'string', 'max:100'],
            'service_date' => ['required_without:entries', ...$serviceDateRules],
            ...$this->moneyReauthRules(),
        ];
    }
}
