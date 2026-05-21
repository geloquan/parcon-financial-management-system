<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Compensation\StoreCompensationRunRequest;
use App\Http\Resources\CompensationRunResource;
use App\Models\Business;
use App\Models\CompensationRun;
use App\Services\CompensationRunService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompensationRunController extends Controller
{
    public function __construct(private readonly CompensationRunService $compensationRunService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return CompensationRunResource::collection($this->compensationRunService->paginate($business));
    }

    public function store(StoreCompensationRunRequest $request, Business $business): CompensationRunResource
    {
        return new CompensationRunResource(
            $this->compensationRunService->store($business, $request->user(), $request->validated())
        );
    }

    public function destroy(Business $business, CompensationRun $compensationRun): array
    {
        abort_if($compensationRun->business_id !== $business->id, 404);

        $this->compensationRunService->delete($compensationRun);

        return ['message' => 'Compensation run deleted successfully.'];
    }
}
