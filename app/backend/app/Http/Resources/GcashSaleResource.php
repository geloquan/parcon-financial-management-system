<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\GcashSale */
class GcashSaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'transaction_recipient' => $this->transaction_recipient,
            'reference_item_name' => $this->reference_item_name,
            'reference_item_original_price' => $this->reference_item_original_price,
            'amount_moved' => $this->amount_moved,
            'sales_amount' => $this->sales_amount,
            'profit_amount' => $this->profit_amount,
            'transaction_type' => $this->transaction_type,
            'transaction_date' => $this->transaction_date?->toIso8601String(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
