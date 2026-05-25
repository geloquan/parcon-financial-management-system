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
        'reference_item_name',
        'reference_item_original_price',
        'color_mode',
        'print_size',
        'paper_count',
        'sales_amount',
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
