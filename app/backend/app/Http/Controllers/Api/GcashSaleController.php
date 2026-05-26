<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreGcashSaleRequest;
use App\Http\Requests\Sales\UpdateGcashSaleRequest;
use App\Http\Resources\GcashSaleResource;
use App\Models\Business;
use App\Models\GcashSale;
use App\Services\GcashSaleService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GcashSaleController extends Controller
{
    public function __construct(private readonly GcashSaleService $gcashSaleService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return GcashSaleResource::collection($this->gcashSaleService->paginate($business));
    }

  public function store(StoreGcashSaleRequest $request, Business $business): GcashSaleResource
    {
        return new GcashSaleResource($this->gcashSaleService->store($business, $request->validated()));
    }

    public function update(UpdateGcashSaleRequest $request, Business $business, GcashSale $gcashSale): GcashSaleResource
    {
        abort_if($gcashSale->business_id !== $business->id, 404);

        return new GcashSaleResource($this->gcashSaleService->update($gcashSale, $request->validated()));
    }

    public function destroy(Business $business, GcashSale $gcashSale): array
    {
        abort_if($gcashSale->business_id !== $business->id, 404);

        $this->gcashSaleService->delete($gcashSale);

        return ['message' => 'GCash sale deleted successfully.'];
    }
}
