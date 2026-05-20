<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PrintSale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'job_type',
        'description',
        'sales_amount',
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
