<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    //
    protected $table = 'sale';

    protected $primaryKey = 'sale_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'customer_name',
        'sale_date',
        'total_amount',
        'payment_method',
        'status'
    ];
}
