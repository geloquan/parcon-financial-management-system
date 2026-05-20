<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EtherealSale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'staff_id',
        'service_cost',
        'discount_percentage',
        'cash_discount',
        'net_amount',
        'service_date',
    ];

    protected $casts = [
        'service_date' => 'date',
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
