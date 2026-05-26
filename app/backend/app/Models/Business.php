<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Business extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'sales_target',
    ];

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function referenceItems(): HasMany
    {
        return $this->hasMany(BusinessReferenceItem::class);
    }
}
