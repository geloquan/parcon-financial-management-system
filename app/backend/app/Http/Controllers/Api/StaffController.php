<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StoreStaffRequest;
use App\Http\Requests\Staff\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Business;
use App\Models\Staff;
use App\Services\StaffService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffController extends Controller
{
    public function __construct(private readonly StaffService $staffService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return StaffResource::collection($this->staffService->paginate($business));
    }

    public function store(StoreStaffRequest $request, Business $business): StaffResource
    {
        return new StaffResource($this->staffService->store($business, $request->validated()));
    }

    public function update(UpdateStaffRequest $request, Business $business, Staff $staff): StaffResource
    {
        abort_if($staff->business_id !== $business->id, 404);

        return new StaffResource($this->staffService->update($staff, $request->validated()));
    }

    public function destroy(Business $business, Staff $staff): array
    {
        abort_if($staff->business_id !== $business->id, 404);

        $this->staffService->delete($staff);

        return ['message' => 'Staff deleted successfully.'];
    }
}
