<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CapitalMovement */
class CapitalMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'initiated_by_user_id' => $this->initiated_by_user_id,
            'amount' => $this->amount,
            'direction' => $this->direction,
            'source_type' => $this->source_type,
            'source_business_id' => $this->source_business_id,
            'target_business_id' => $this->target_business_id,
            'occurred_on' => $this->occurred_on?->toDateString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
