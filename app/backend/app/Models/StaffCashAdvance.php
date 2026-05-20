<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffCashAdvance extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'staff_id',
        'amount',
        'date_issued',
        'remaining_balance',
        'status',
    ];

    protected $casts = [
        'date_issued' => 'date',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}
