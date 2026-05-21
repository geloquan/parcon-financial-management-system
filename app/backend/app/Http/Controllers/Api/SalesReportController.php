<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\GenerateSalesReportRequest;
use App\Jobs\GenerateSalesReportJob;
use App\Http\Requests\Reports\StoreSalesReportRequest;
use App\Http\Resources\SalesReportVersionResource;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use App\Models\SalesReportVersion;
use App\Services\SalesReportService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SalesReportController extends Controller
{
  public function __construct(private readonly SalesReportService $salesReportService)
  {
  }

  public function index(Business $business): AnonymousResourceCollection
  {
    return SalesReportVersionResource::collection($this->salesReportService->paginate($business));
  }

  public function store(StoreSalesReportRequest $request, Business $business): SalesReportVersionResource
  {
    return new SalesReportVersionResource(
      $this->salesReportService->store($business, $request->user(), $request->validated())
    );
  }

  public function generate(GenerateSalesReportRequest $request): JsonResponse
  {
    $validated = $request->validated();
    $this->ensureReportAccess($request->user(), $validated);

    return response()->json(
      $this->salesReportService->generate($validated)
    );
  }

  private function ensureReportAccess($user, array $validated): void
  {
    if ($user->hasAnyRole(['admin', 'owner'])) {
      return;
    }

    if (($validated['scope'] ?? '') !== 'business') {
      abort(403, 'Forbidden.');
    }

    $businessId = (int)($validated['business_id'] ?? 0);
    $business = Business::query()->find($businessId);

    if (!$business) {
      abort(403, 'Forbidden.');
    }

    if ($user->hasRole('staff')) {
      if ($user->business_id !== $business->id) {
        abort(403, 'Forbidden.');
      }

      return;
    }

    $staffRole = $user->getRoleNames()
      ->first(fn(string $role): bool => str_ends_with($role, '-staff'));

    if (!$staffRole) {
      abort(403, 'Forbidden.');
    }

    $expectedSlug = str_replace('-staff', '', $staffRole);
    if ($business->slug !== $expectedSlug) {
      abort(403, 'Forbidden.');
    }
  }

  public function download(Business $business, SalesReportVersion $salesReportVersion)
  {
    abort_if($salesReportVersion->business_id !== $business->id, 404);

    $download = $this->salesReportService->download($business, $salesReportVersion);

    return response($download['content'], 200, [
      'Content-Type' => 'application/pdf',
      'Content-Disposition' => sprintf('attachment; filename="%s"', $download['filename']),
    ]);
  }
}
