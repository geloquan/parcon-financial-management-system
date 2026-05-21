<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SalesReportVersion */
class SalesReportVersionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'generated_by_user_id' => $this->generated_by_user_id,
            'version' => $this->version,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'document_title' => $this->document_title,
            'document_format' => $this->document_format,
            'metadata' => $this->metadata,
            'details' => $this->details,
            'download_url' => route('sales-reports.download', [
                'business' => $this->business_id,
                'salesReportVersion' => $this->id,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
