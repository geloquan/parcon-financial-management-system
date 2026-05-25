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
        'staff_ids',
        'service_name',
        'reference_item_name',
        'reference_item_original_price',
        'service_cost',
        'discount_percentage',
        'customer_name',
        'discount_type',
        'cash_discount',
        'net_amount',
        'is_debt',
        'charged_amount',
        'remarks',
        'service_date',
    ];

    protected $casts = [
        'service_date' => 'datetime',
        'staff_ids' => 'array',
        'is_debt' => 'boolean',
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
