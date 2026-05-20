<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CapitalMovement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'initiated_by_user_id',
        'amount',
        'direction',
        'source_type',
        'source_business_id',
        'target_business_id',
        'occurred_on',
        'notes',
    ];

    protected $casts = [
        'occurred_on' => 'date',
    ];

    public function initiatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_user_id');
    }

    public function sourceBusiness(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'source_business_id');
    }

    public function targetBusiness(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'target_business_id');
    }
}
