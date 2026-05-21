<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CompensationRun extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'computed_by_user_id',
        'computation_mode',
        'number_of_days',
        'cutoff_date',
        'period_start',
        'period_end',
        'gross_pay',
        'total_deductions',
        'net_pay',
        'employee_breakdown',
    ];

    protected $casts = [
        'cutoff_date' => 'date',
        'period_start' => 'date',
        'period_end' => 'date',
        'employee_breakdown' => 'array',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function computedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'computed_by_user_id');
    }
}
