<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreStaffDayOffRequest;
use App\Http\Resources\StaffDayOffResource;
use App\Models\Business;
use App\Models\StaffDayOff;
use App\Services\StaffDayOffService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffDayOffController extends Controller
{
    public function __construct(private readonly StaffDayOffService $staffDayOffService)
    {
    }

    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        return StaffDayOffResource::collection(
            $this->staffDayOffService->paginate($business, $request->query('day_off_on'))
        );
    }

    public function store(StoreStaffDayOffRequest $request, Business $business): StaffDayOffResource
    {
        return new StaffDayOffResource($this->staffDayOffService->store($business, $request->validated()));
    }

    public function destroy(Business $business, StaffDayOff $staffDayOff): array
    {
        abort_if($staffDayOff->business_id !== $business->id, 404);

        $this->staffDayOffService->delete($staffDayOff);

        return ['message' => 'Staff day-off removed successfully.'];
    }
}
