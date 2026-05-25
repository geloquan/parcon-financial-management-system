<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Business;
use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function __construct(private readonly ExpenseService $expenseService)
    {
    }

    public function index(Business $business): AnonymousResourceCollection
    {
        return ExpenseResource::collection($this->expenseService->paginate($business));
    }

    public function store(StoreExpenseRequest $request, Business $business): ExpenseResource
    {
        return new ExpenseResource($this->expenseService->store($business, $request->validated()));
    }

    public function update(UpdateExpenseRequest $request, Business $business, Expense $expense): ExpenseResource
    {
        abort_if($expense->business_id !== $business->id, 404);

        return new ExpenseResource($this->expenseService->update($expense, $request->validated()));
    }

    public function destroy(Business $business, Expense $expense): array
    {
        abort_if($expense->business_id !== $business->id, 404);

        $this->expenseService->delete($expense);

        return ['message' => 'Expense deleted successfully.'];
    }
    public function downloadProof(Business $business, Expense $expense)
    {
        abort_if($expense->business_id !== $business->id, 404);

        $download = $this->expenseService->getProofDownload($expense);
        abort_unless($download, 404, 'Proof file not found.');

        return response($download['content'], 200, [
            'Content-Type' => $download['mime_type'],
            'Content-Disposition' => sprintf('inline; filename="%s"', $download['filename']),
        ]);
    }

}
