<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseDetail extends Model
{
    //
    protected $table = 'purchase_detail';

    protected $primaryKey = 'purchase_detail_id';

    public $timestamps = false;

    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',
        'unit_cost',
        'sub_total'
    ];

    // Details belongs to purchase
    public function purchase()
    {
        return $this->belongsTo(
            Purchase::class,
            'purchase_detail_id',
            'purchase_detail_id'
        );
    }

    // Details belongs to porduct
    public function product()
    {
        
    }
}
