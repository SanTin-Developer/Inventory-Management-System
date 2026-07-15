<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleDetail extends Model
{
    //

    
    protected $table = 'sale_details';

    protected $primaryKey = 'sale_detail_id';

    public $timestamps = false;

    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'sub_total'
    ];

    // Details belongs to sale
    public function sale()
    {
        return $this->belongsTo(
            Sale::class,
            'sale_detail_id',
            'sale_detail_id'
        );
    }

    // Details belongs to products
    public function product()
    {
        return $this->belongsTo(
            Product::class,
            'sale_detail_id',
            'sale_detail_id'
        );
    }
}
