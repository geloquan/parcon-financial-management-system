<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreEtherealSaleRequest;
use App\Http\Requests\Sales\UpdateEtherealSaleRequest;
use App\Http\Resources\EtherealSaleResource;
use App\Models\Business;
use App\Models\EtherealSale;
use App\Services\EtherealSaleService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EtherealSaleController extends Controller
{
    public function __construct(private readonly EtherealSaleService $etherealSaleService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return EtherealSaleResource::collection($this->etherealSaleService->paginate($business));
    }

    public function store(StoreEtherealSaleRequest $request, Business $business): EtherealSaleResource
    {
        return new EtherealSaleResource($this->etherealSaleService->store($business, $request->validated()));
    }

    public function update(UpdateEtherealSaleRequest $request, Business $business, EtherealSale $etherealSale): EtherealSaleResource
    {
        abort_if($etherealSale->business_id !== $business->id, 404);

        return new EtherealSaleResource($this->etherealSaleService->update($etherealSale, $request->validated()));
    }

    public function destroy(Business $business, EtherealSale $etherealSale): array
    {
        abort_if($etherealSale->business_id !== $business->id, 404);

        $this->etherealSaleService->delete($etherealSale);

        return ['message' => 'Ethereal sale deleted successfully.'];
    }
}
