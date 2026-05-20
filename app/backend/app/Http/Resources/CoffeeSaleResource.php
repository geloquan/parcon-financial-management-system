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
            'size' => $this->size,
            'add_ons' => $this->add_ons,
            'sale_date' => $this->sale_date?->toDateString(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
