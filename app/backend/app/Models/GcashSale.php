<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GcashSale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'transaction_recipient',
        'reference_item_name',
        'reference_item_original_price',
        'amount_moved',
        'sales_amount',
        'profit_amount',
        'is_debt',
        'charged_amount',
        'remarks',
        'transaction_type',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'is_debt' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
