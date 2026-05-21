<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StaffSchedule */
class StaffScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'staff_id' => $this->staff_id,
            'staff_name' => $this->staff?->full_name,
            'scheduled_on' => $this->scheduled_on?->toDateString(),
            'attendance_status' => $this->attendance_status,
            'attendance_marked_at' => $this->attendance_marked_at?->toIso8601String(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
