<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockHistory extends Model
{
    use HasFactory;

    protected $table = 'stock_history';

    protected $primaryKey = 'history_id';

    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'transaction_type',
        'quantity',
        'old_quantity',
        'new_quantity',
        'created_at',
    ];

    // History belongs to product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
