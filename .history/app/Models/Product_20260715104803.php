<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Product extends Model
{
    //
    use HasFactory;

    protected $table = 'products';

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

    // Products belongs to category
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    // Product appears in purchase details
    public function purchaseDetail()
    {
        return $this->hasMany(PurchaseDetail::class, 'product_id', 'product_id');
    }

    // Product appears in sale details
    public function saleDetail()
    {
        return $this->hasMany(SaleDetail::class, 'product_id', 'product_id');
    }

    // Product has stock history
    public function stockHistory()
    {
        return $this->hasMany(StockHistory::class,'product_id',
            'product_id'
        );
    }
}
