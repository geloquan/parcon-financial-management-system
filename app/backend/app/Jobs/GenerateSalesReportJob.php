<?php

namespace App\Jobs;

use App\Services\SalesReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;

class GenerateSalesReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly array $filters)
    {
    }

    public function handle(SalesReportService $salesReportService): array
    {
        return $salesReportService->generate(Arr::only($this->filters, [
            'scope',
            'business_id',
            'period',
            'start_date',
            'end_date',
        ]));
    }
}
