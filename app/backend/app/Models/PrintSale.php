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
        'color_mode',
        'print_size',
        'paper_count',
        'sales_amount',
        'sale_date',
    ];

    protected $casts = [
        'sale_date' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
