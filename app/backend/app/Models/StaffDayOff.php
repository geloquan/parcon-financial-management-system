<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffDayOff extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'staff_id',
        'day_off_on',
        'notes',
    ];

    protected $casts = [
        'day_off_on' => 'date',
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
