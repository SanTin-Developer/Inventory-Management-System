<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    //
    protected $table = 'product';

    protected $primaryKey = 'product_id';

    public $timestamps = false;

    protected $fillable = [
        'category_id',
        'product_name',
        'product_code',
        'unit_price',
        'cost_price',
        'quantiry_in_stock',
        'reorder_level',
        'unit',
        'created_at',
        'updated_at',
    ];
}
