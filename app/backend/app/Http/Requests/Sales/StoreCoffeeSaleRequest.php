<?php

namespace App\Http\Requests\Sales;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCoffeeSaleRequest extends FormRequest
{
    use HasMoneyReauthRules;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $now = Carbon::now();

        $saleDateRules = [
            'required',
            'date',
        ];

        if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
            $saleDateRules[] = 'after_or_equal:today';
        }

        return [
            'entries' => ['nullable', 'array', 'min:1'],
            'entries.*.price' => ['required_with:entries', 'numeric', 'min:0'],
            'entries.*.coffee_type' => ['required_with:entries', 'string', 'max:255'],
            'entries.*.reference_item_name' => ['nullable', 'string', 'max:255'],
            'entries.*.reference_item_original_price' => ['nullable', 'numeric', 'min:0'],
            'entries.*.size' => ['required_with:entries', 'in:8oz,9oz,12oz,16oz,18oz'],
            'entries.*.add_on_price' => ['required_with:entries', 'numeric', 'min:0'],
            'entries.*.add_on_description' => ['nullable', 'string', 'max:500'],
            'entries.*.is_debt' => ['sometimes', 'boolean'],
            'entries.*.charged_amount' => ['nullable', 'numeric', 'min:0'],
            'entries.*.remarks' => ['nullable', 'string', 'max:1000'],
            'entries.*.sale_date' => $saleDateRules,
            'price' => ['required_without:entries', 'numeric', 'min:0'],
            'coffee_type' => ['required_without:entries', 'string', 'max:255'],
            'reference_item_name' => ['nullable', 'string', 'max:255'],
            'reference_item_original_price' => ['nullable', 'numeric', 'min:0'],
            'size' => ['required_without:entries', 'in:8oz,9oz,12oz,16oz,18oz'],
            'add_on_price' => ['required_without:entries', 'numeric', 'min:0'],
            'add_on_description' => ['nullable', 'string', 'max:500'],
            'is_debt' => ['sometimes', 'boolean'],
            'charged_amount' => ['nullable', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:1000'],
            'sale_date' => ['required_without:entries', ...$saleDateRules],
            ...$this->moneyReauthRules(),
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function (Validator $validator): void {
            $entries = $this->input('entries');

            if (is_array($entries) && $entries !== []) {
                foreach ($entries as $index => $entry) {
                    $isDebt = (bool) ($entry['is_debt'] ?? false);
                    $remarks = trim((string) ($entry['remarks'] ?? ''));

                    if ($isDebt && $remarks === '') {
                        $validator->errors()->add("entries.{$index}.remarks", 'The remarks field is required when debt is enabled.');
                    }
                }

                return;
            }

            $isDebt = (bool) $this->input('is_debt', false);
            $remarks = trim((string) $this->input('remarks', ''));

            if ($isDebt && $remarks === '') {
                $validator->errors()->add('remarks', 'The remarks field is required when debt is enabled.');
            }
        });
    }
}
