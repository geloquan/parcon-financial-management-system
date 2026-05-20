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
        'size',
        'add_ons',
        'sale_date',
    ];

    protected $casts = [
        'sale_date' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
