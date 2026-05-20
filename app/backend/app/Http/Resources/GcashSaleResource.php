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
            'amount_moved' => $this->amount_moved,
            'sales_amount' => $this->sales_amount,
            'profit_amount' => $this->profit_amount,
            'transaction_type' => $this->transaction_type,
            'transaction_date' => $this->transaction_date?->toDateString(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
