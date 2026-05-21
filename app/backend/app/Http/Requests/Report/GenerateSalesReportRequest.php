<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;

class GenerateSalesReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'scope' => ['required', 'in:portfolio,business'],
            'business_id' => ['nullable', 'integer', 'exists:businesses,id'],
            'period' => ['required', 'in:today,date_range'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->input('scope') === 'business' && ! $this->filled('business_id')) {
                $validator->errors()->add('business_id', 'The business_id field is required when scope is business.');
            }

            if ($this->input('period') === 'date_range') {
                if (! $this->filled('start_date')) {
                    $validator->errors()->add('start_date', 'The start_date field is required when period is date_range.');
                }

                if (! $this->filled('end_date')) {
                    $validator->errors()->add('end_date', 'The end_date field is required when period is date_range.');
                }
            }
        });
    }
}
