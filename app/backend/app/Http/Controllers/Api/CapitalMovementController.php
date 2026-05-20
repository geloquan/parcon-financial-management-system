<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Capital\StoreBusinessCapitalMovementRequest;
use App\Http\Requests\Capital\StorePortfolioCapitalMovementRequest;
use App\Http\Resources\CapitalMovementResource;
use App\Models\Business;
use App\Services\CapitalMovementService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CapitalMovementController extends Controller
{
    public function __construct(private readonly CapitalMovementService $capitalMovementService)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        return CapitalMovementResource::collection($this->capitalMovementService->paginate());
    }

    public function storePortfolio(StorePortfolioCapitalMovementRequest $request): CapitalMovementResource
    {
        return new CapitalMovementResource(
            $this->capitalMovementService->storePortfolioMovement($request->user(), $request->validated())
        );
    }

    public function storeBusiness(StoreBusinessCapitalMovementRequest $request, Business $business): CapitalMovementResource
    {
        return new CapitalMovementResource(
            $this->capitalMovementService->storeBusinessMovement($request->user(), $business, $request->validated())
        );
    }
}
