<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Staff extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'full_name',
        'age',
        'employment_start_date',
        'employment_end_date',
        'employment_type',
        'salary',
        'commission_rate_percent',
        'is_active',
    ];

    protected $casts = [
        'employment_start_date' => 'date',
        'employment_end_date' => 'date',
        'is_active' => 'boolean',
        'commission_rate_percent' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function cashAdvances(): HasMany
    {
        return $this->hasMany(StaffCashAdvance::class);
    }
}
