<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockHistory extends Model
{
    //
    protected $table = 'stock_history';

    protected $primaryKey = 'history_id';

    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'transaction_type',
        'quantity',
        'old_quantity'
    ];
}
