<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\GenerateSalesReportRequest;
use App\Jobs\GenerateSalesReportJob;
use App\Models\Business;
use Illuminate\Http\JsonResponse;

class SalesReportController extends Controller
{
    public function store(GenerateSalesReportRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $this->ensureReportAccess($request->user(), $validated);

        return response()->json(GenerateSalesReportJob::dispatchSync($validated));
    }

    private function ensureReportAccess($user, array $validated): void
    {
        if ($user->hasAnyRole(['admin', 'owner'])) {
            return;
        }

        if (($validated['scope'] ?? '') !== 'business') {
            abort(403, 'Forbidden.');
        }

        $businessId = (int) ($validated['business_id'] ?? 0);
        $business = Business::query()->find($businessId);

        if (! $business) {
            abort(403, 'Forbidden.');
        }

        if ($user->hasRole('staff')) {
            if ($user->business_id !== $business->id) {
                abort(403, 'Forbidden.');
            }

            return;
        }

        $staffRole = $user->getRoleNames()
            ->first(fn (string $role): bool => str_ends_with($role, '-staff'));

        if (! $staffRole) {
            abort(403, 'Forbidden.');
        }

        $expectedSlug = str_replace('-staff', '', $staffRole);
        if ($business->slug !== $expectedSlug) {
            abort(403, 'Forbidden.');
        }
    }
}
