<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\EtherealSale */
class EtherealSaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'staff_id' => $this->staff_id,
            'staff_ids' => $this->staff_ids ?? ($this->staff_id ? [$this->staff_id] : []),
            'service_cost' => $this->service_cost,
            'discount_percentage' => $this->discount_percentage,
            'customer_name' => $this->customer_name,
            'discount_type' => $this->discount_type,
            'cash_discount' => $this->cash_discount,
            'net_amount' => $this->net_amount,
            'service_date' => $this->service_date?->toIso8601String(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
