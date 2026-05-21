<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Schedule\StoreStaffScheduleRequest;
use App\Http\Requests\Schedule\UpdateStaffScheduleRequest;
use App\Http\Resources\StaffScheduleResource;
use App\Models\Business;
use App\Models\StaffSchedule;
use App\Services\StaffScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffScheduleController extends Controller
{
    public function __construct(private readonly StaffScheduleService $staffScheduleService)
    {
    }

    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        return StaffScheduleResource::collection(
            $this->staffScheduleService->paginate($business, $request->query('scheduled_on'))
        );
    }

    public function store(StoreStaffScheduleRequest $request, Business $business): StaffScheduleResource
    {
        return new StaffScheduleResource($this->staffScheduleService->store($business, $request->validated()));
    }

    public function update(UpdateStaffScheduleRequest $request, Business $business, StaffSchedule $staffSchedule): StaffScheduleResource
    {
        abort_if($staffSchedule->business_id !== $business->id, 404);

        return new StaffScheduleResource($this->staffScheduleService->update($staffSchedule, $request->validated()));
    }

    public function destroy(Business $business, StaffSchedule $staffSchedule): array
    {
        abort_if($staffSchedule->business_id !== $business->id, 404);

        $this->staffScheduleService->delete($staffSchedule);

        return ['message' => 'Staff schedule deleted successfully.'];
    }
}
