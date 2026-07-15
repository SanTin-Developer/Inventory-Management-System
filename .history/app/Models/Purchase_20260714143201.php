<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    //
    protected $table = 'purchase';

    protected $primaryKey = 'purchase_id';

    public $timestamps = false;

    protected $fillable = [
        'supplier_id',
        'user_id',
        'purchase_date',
        'total_amount',
        'status',
        
    ];
}
