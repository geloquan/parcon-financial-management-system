<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CompensationRun */
class CompensationRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'computed_by_user_id' => $this->computed_by_user_id,
            'computation_mode' => $this->computation_mode,
            'number_of_days' => $this->number_of_days,
            'cutoff_date' => $this->cutoff_date?->toDateString(),
            'period_start' => $this->period_start?->toDateString(),
            'period_end' => $this->period_end?->toDateString(),
            'gross_pay' => $this->gross_pay,
            'total_deductions' => $this->total_deductions,
            'net_pay' => $this->net_pay,
            'employee_breakdown' => $this->employee_breakdown,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
