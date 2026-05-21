<?php

namespace App\Http\Requests\Sales;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Illuminate\Foundation\Http\FormRequest;

class StorePrintSaleRequest extends FormRequest
{
    use HasMoneyReauthRules;

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
            'entries' => ['nullable', 'array', 'min:1'],
            'entries.*.job_type' => ['required_with:entries', 'string', 'max:100'],
            'entries.*.description' => ['required_with:entries', 'string', 'max:500'],
            'entries.*.color_mode' => ['required_with:entries', 'in:black,white'],
            'entries.*.print_size' => ['required_with:entries', 'string', 'max:100'],
            'entries.*.paper_count' => ['required_with:entries', 'integer', 'min:1'],
            'entries.*.sales_amount' => ['required_with:entries', 'numeric', 'min:0'],
            'entries.*.sale_date' => $saleDateRules,
            'job_type' => ['required_without:entries', 'string', 'max:100'],
            'description' => ['required_without:entries', 'string', 'max:500'],
            'color_mode' => ['required_without:entries', 'in:black,white'],
            'print_size' => ['required_without:entries', 'string', 'max:100'],
            'paper_count' => ['required_without:entries', 'integer', 'min:1'],
            'sales_amount' => ['required_without:entries', 'numeric', 'min:0'],
            'sale_date' => ['required_without:entries', ...$saleDateRules],
            ...$this->moneyReauthRules(),
        ];
    }
}
