<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Expense */
class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'date_issued' => $this->date_issued?->toIso8601String(),
            'amount' => $this->amount,
            'description' => $this->description,
            'purpose' => $this->purpose,
            'payment_type' => $this->payment_type,
            'recurrence_reference' => $this->recurrence_reference,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
