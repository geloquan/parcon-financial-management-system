<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Capital\StorePortfolioCapitalMovementRequest;
use App\Http\Resources\CapitalMovementResource;
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
}
