<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreStaffAbsenceRequest;
use App\Http\Resources\StaffAbsenceResource;
use App\Models\Business;
use App\Models\StaffAbsence;
use App\Services\StaffAbsenceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StaffAbsenceController extends Controller
{
    public function __construct(private readonly StaffAbsenceService $staffAbsenceService)
    {
    }

    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        return StaffAbsenceResource::collection(
            $this->staffAbsenceService->paginate($business, $request->query('absent_on'))
        );
    }

    public function store(StoreStaffAbsenceRequest $request, Business $business): StaffAbsenceResource
    {
        return new StaffAbsenceResource($this->staffAbsenceService->store($business, $request->validated()));
    }

    public function destroy(Business $business, StaffAbsence $staffAbsence): array
    {
        abort_if($staffAbsence->business_id !== $business->id, 404);

        $this->staffAbsenceService->delete($staffAbsence);

        return ['message' => 'Staff absence removed successfully.'];
    }
}
