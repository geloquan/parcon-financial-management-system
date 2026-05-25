<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Expense;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ExpenseService
{
    public function paginate(Business $business): LengthAwarePaginator
    {
        return Expense::query()
            ->where('business_id', $business->id)
            ->latest('id')
            ->paginate(15);
    }

    public function store(Business $business, array $validated): Expense
    {
        $proofFile = $validated['proof'] ?? null;
        unset($validated['proof']);

        if ($proofFile instanceof UploadedFile) {
            $validated['proof_path'] = $this->storeProof($business, $proofFile);
        }

        return Expense::query()->create([...$validated, 'business_id' => $business->id]);
    }

    public function update(Expense $expense, array $validated): Expense
    {
        $proofFile = $validated['proof'] ?? null;
        unset($validated['proof']);

        if ($proofFile instanceof UploadedFile) {
            if ($expense->proof_path && Storage::disk('local')->exists($expense->proof_path)) {
                Storage::disk('local')->delete($expense->proof_path);
            }
            $validated['proof_path'] = $this->storeProof($expense->business, $proofFile);
        }

        $expense->update($validated);

        return $expense->refresh();
    }

    public function delete(Expense $expense): void
    {
        if ($expense->proof_path && Storage::disk('local')->exists($expense->proof_path)) {
            Storage::disk('local')->delete($expense->proof_path);
        }

        $expense->delete();
    }

    public function getProofDownload(Expense $expense): ?array
    {
        if (! $expense->proof_path || ! Storage::disk('local')->exists($expense->proof_path)) {
            return null;
        }

        return [
            'content' => Storage::disk('local')->get($expense->proof_path),
            'mime_type' => Storage::disk('local')->mimeType($expense->proof_path) ?? 'application/octet-stream',
            'filename' => basename($expense->proof_path),
        ];
    }

    private function storeProof(Business $business, UploadedFile $proofFile): string
    {
        return $proofFile->store("expenses/proofs/business-{$business->id}", 'local');
    }
}
