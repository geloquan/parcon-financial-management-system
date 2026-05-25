<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoffeeSale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'price',
        'coffee_type',
        'reference_item_name',
        'reference_item_original_price',
        'size',
        'add_on_price',
        'add_on_description',
        'is_debt',
        'charged_amount',
        'remarks',
        'sale_date',
    ];

    protected $casts = [
        'sale_date' => 'datetime',
        'is_debt' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
