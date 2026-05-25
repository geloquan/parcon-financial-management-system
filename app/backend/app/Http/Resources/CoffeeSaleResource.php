<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CoffeeSale */
class CoffeeSaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'price' => $this->price,
            'coffee_type' => $this->coffee_type,
            'reference_item_name' => $this->reference_item_name,
            'reference_item_original_price' => $this->reference_item_original_price,
            'size' => $this->size,
            'add_on_price' => $this->add_on_price,
            'total_amount' => round(((float) $this->price) + ((float) $this->add_on_price), 2),
            'add_on_description' => $this->add_on_description,
            'is_debt' => $this->is_debt,
            'charged_amount' => $this->charged_amount,
            'remarks' => $this->remarks,
            'sale_date' => $this->sale_date?->toIso8601String(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
