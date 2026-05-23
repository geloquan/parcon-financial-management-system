<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalesReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'document_title' => ['nullable', 'string', 'max:255'],
            'report_type' => ['nullable', 'in:sales,compensation,combined'],
            'report_scope' => ['nullable', 'in:business,all_businesses'],
        ];
    }
}
