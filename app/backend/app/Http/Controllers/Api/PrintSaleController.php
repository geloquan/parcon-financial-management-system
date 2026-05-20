<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StorePrintSaleRequest;
use App\Http\Requests\Sales\UpdatePrintSaleRequest;
use App\Http\Resources\PrintSaleResource;
use App\Models\Business;
use App\Models\PrintSale;
use App\Services\PrintSaleService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PrintSaleController extends Controller
{
    public function __construct(private readonly PrintSaleService $printSaleService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return PrintSaleResource::collection($this->printSaleService->paginate($business));
    }

    public function store(StorePrintSaleRequest $request, Business $business): PrintSaleResource
    {
        return new PrintSaleResource($this->printSaleService->store($business, $request->validated()));
    }

    public function update(UpdatePrintSaleRequest $request, Business $business, PrintSale $printSale): PrintSaleResource
    {
        abort_if($printSale->business_id !== $business->id, 404);

        return new PrintSaleResource($this->printSaleService->update($printSale, $request->validated()));
    }

    public function destroy(Business $business, PrintSale $printSale): array
    {
        abort_if($printSale->business_id !== $business->id, 404);

        $this->printSaleService->delete($printSale);

        return ['message' => 'Print sale deleted successfully.'];
    }
}
