<?php

namespace App\Http\Requests\Compensation;

use Illuminate\Foundation\Http\FormRequest;

class FinalizeCompensationRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }
}
