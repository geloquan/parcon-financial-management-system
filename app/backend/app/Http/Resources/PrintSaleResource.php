<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PrintSale */
class PrintSaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'job_type' => $this->job_type,
            'description' => $this->description,
            'reference_item_name' => $this->reference_item_name,
            'reference_item_original_price' => $this->reference_item_original_price,
            'color_mode' => $this->color_mode,
            'print_size' => $this->print_size,
            'paper_count' => $this->paper_count,
            'sales_amount' => $this->sales_amount,
            'sale_date' => $this->sale_date?->toIso8601String(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
