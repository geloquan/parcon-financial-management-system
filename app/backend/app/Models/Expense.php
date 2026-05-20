<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'date_issued',
        'amount',
        'description',
        'purpose',
        'payment_type',
        'recurrence_reference',
    ];

    protected $casts = [
        'date_issued' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
