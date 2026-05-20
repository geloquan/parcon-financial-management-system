<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreCoffeeSaleRequest;
use App\Http\Requests\Sales\UpdateCoffeeSaleRequest;
use App\Http\Resources\CoffeeSaleResource;
use App\Models\Business;
use App\Models\CoffeeSale;
use App\Services\CoffeeSaleService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CoffeeSaleController extends Controller
{
    public function __construct(private readonly CoffeeSaleService $coffeeSaleService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return CoffeeSaleResource::collection($this->coffeeSaleService->paginate($business));
    }

    public function store(StoreCoffeeSaleRequest $request, Business $business): CoffeeSaleResource
    {
        return new CoffeeSaleResource($this->coffeeSaleService->store($business, $request->validated()));
    }

    public function update(UpdateCoffeeSaleRequest $request, Business $business, CoffeeSale $coffeeSale): CoffeeSaleResource
    {
        abort_if($coffeeSale->business_id !== $business->id, 404);

        return new CoffeeSaleResource($this->coffeeSaleService->update($coffeeSale, $request->validated()));
    }

    public function destroy(Business $business, CoffeeSale $coffeeSale): array
    {
        abort_if($coffeeSale->business_id !== $business->id, 404);

        $this->coffeeSaleService->delete($coffeeSale);

        return ['message' => 'Coffee sale deleted successfully.'];
    }
}
