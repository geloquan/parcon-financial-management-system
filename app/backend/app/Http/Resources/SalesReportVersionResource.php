<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SalesReportVersion */
class SalesReportVersionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $metadata = $this->metadata ?? [];
        $details = $this->details ?? [];
        $reportScope = (string) ($metadata['report_scope'] ?? $details['report_scope'] ?? 'business');

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'generated_by_user_id' => $this->generated_by_user_id,
            'version' => $this->version,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'document_title' => $this->document_title,
            'document_format' => $this->document_format,
            'report_type' => $this->report_type,
            'file_path' => $this->file_path,
            'file_name' => $this->file_path ? basename($this->file_path) : null,
            'file_size_bytes' => $this->file_size_bytes,
            'metadata' => $metadata,
            'details' => $details,
            'pdf_verification' => $this->when(
                $this->resource->offsetExists('pdf_verification'),
                fn () => $this->resource->getAttribute('pdf_verification')
            ),
            'download_url' => route('sales-reports.download', [
                'business' => $this->business_id,
                'salesReportVersion' => $this->id,
            ]),
            'portfolio_download_url' => $this->when(
                $reportScope === 'all_businesses',
                fn () => route('portfolio-sales-reports.download', [
                    'salesReportVersion' => $this->id,
                ])
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
