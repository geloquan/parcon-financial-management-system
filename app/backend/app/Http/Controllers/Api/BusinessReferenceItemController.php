<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BusinessReferenceItem\StoreBusinessReferenceItemRequest;
use App\Http\Requests\BusinessReferenceItem\UpdateBusinessReferenceItemRequest;
use App\Http\Resources\BusinessReferenceItemResource;
use App\Models\Business;
use App\Models\BusinessReferenceItem;
use App\Services\BusinessReferenceItemService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BusinessReferenceItemController extends Controller
{
    public function __construct(private readonly BusinessReferenceItemService $businessReferenceItemService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return BusinessReferenceItemResource::collection($this->businessReferenceItemService->paginate($business));
    }

    public function store(StoreBusinessReferenceItemRequest $request, Business $business): BusinessReferenceItemResource
    {
        return new BusinessReferenceItemResource(
            $this->businessReferenceItemService->store($business, $request->validated())
        );
    }

    public function update(
        UpdateBusinessReferenceItemRequest $request,
        Business $business,
        BusinessReferenceItem $businessReferenceItem
    ): BusinessReferenceItemResource {
        abort_if($businessReferenceItem->business_id !== $business->id, 404);

        return new BusinessReferenceItemResource(
            $this->businessReferenceItemService->update($businessReferenceItem, $request->validated())
        );
    }

    public function destroy(Business $business, BusinessReferenceItem $businessReferenceItem): array
    {
        abort_if($businessReferenceItem->business_id !== $business->id, 404);
        $this->businessReferenceItemService->delete($businessReferenceItem);

        return ['message' => 'Business reference item deleted successfully.'];
    }
}
