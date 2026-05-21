<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessReferenceItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'item_type',
        'name',
        'price',
        'description',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
