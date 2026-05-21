<?php

namespace App\Http\Requests\BusinessReferenceItem;

use Illuminate\Foundation\Http\FormRequest;

class StoreBusinessReferenceItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'item_type' => ['required', 'in:product,service'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
