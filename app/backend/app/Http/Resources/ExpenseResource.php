<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Expense */
class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'date_issued' => $this->date_issued?->toIso8601String(),
            'amount' => $this->amount,
            'description' => $this->description,
            'purpose' => $this->purpose,
            'recurrence_reference' => $this->recurrence_reference,
            'proof_file_name' => $this->proof_path ? basename($this->proof_path) : null,
            'proof_download_url' => $this->proof_path && Storage::disk('local')->exists($this->proof_path)
                ? route('expenses.proof.download', [
                    'business' => $this->business_id,
                    'expense' => $this->id,
                ])
                : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
