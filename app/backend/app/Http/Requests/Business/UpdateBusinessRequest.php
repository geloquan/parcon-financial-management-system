<?php

namespace App\Http\Requests\Business;

use App\Models\Business;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'owner']) ?? false;
    }

    public function rules(): array
    {
        /** @var Business $business */
        $business = $this->route('business');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('businesses', 'slug')->ignore($business->id)],
            'description' => ['nullable', 'string'],
        ];
    }
}
