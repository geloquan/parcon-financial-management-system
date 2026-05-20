<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessRequest;
use App\Http\Requests\Business\UpdateBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use App\Services\BusinessService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BusinessController extends Controller
{
    public function __construct(private readonly BusinessService $businessService)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        if (! in_array($user->role, ['admin', 'owner'], true)) {
            if (! $user->business_id) {
                return BusinessResource::collection(Business::query()->whereRaw('1 = 0')->paginate(15));
            }

            return BusinessResource::collection(Business::query()->where('id', $user->business_id)->paginate(15));
        }

        return BusinessResource::collection($this->businessService->paginate());
    }

    public function store(StoreBusinessRequest $request): BusinessResource
    {
        return new BusinessResource($this->businessService->store($request->validated()));
    }

    public function show(Business $business): BusinessResource
    {
        $user = request()->user();
        if (! in_array($user->role, ['admin', 'owner'], true) && $user->business_id !== $business->id) {
            abort(403);
        }

        return new BusinessResource($business);
    }

    public function update(UpdateBusinessRequest $request, Business $business): BusinessResource
    {
        return new BusinessResource($this->businessService->update($business, $request->validated()));
    }

    public function destroy(Business $business): array
    {
        $this->businessService->delete($business);

        return ['message' => 'Business deleted successfully.'];
    }
}
