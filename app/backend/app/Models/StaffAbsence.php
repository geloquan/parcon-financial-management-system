<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffAbsence extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'staff_id',
        'absent_on',
        'notes',
    ];

    protected $casts = [
        'absent_on' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}
