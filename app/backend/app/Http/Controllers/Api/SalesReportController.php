<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\StoreSalesReportRequest;
use App\Http\Resources\SalesReportVersionResource;
use App\Models\Business;
use App\Models\SalesReportVersion;
use App\Services\SalesReportService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SalesReportController extends Controller
{
    public function __construct(private readonly SalesReportService $salesReportService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return SalesReportVersionResource::collection($this->salesReportService->paginate($business));
    }

    public function store(StoreSalesReportRequest $request, Business $business): SalesReportVersionResource
    {
        return new SalesReportVersionResource(
            $this->salesReportService->store($business, $request->user(), $request->validated())
        );
    }

    public function download(Business $business, SalesReportVersion $salesReportVersion)
    {
        abort_if($salesReportVersion->business_id !== $business->id, 404);

        $download = $this->salesReportService->download($business, $salesReportVersion);

        return response($download['content'], 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('attachment; filename="%s"', $download['filename']),
        ]);
    }
}
