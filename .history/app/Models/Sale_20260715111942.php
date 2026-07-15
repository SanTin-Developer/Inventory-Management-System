<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    //
    use

    protected $table = 'sales';

    protected $primaryKey = 'sale_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'customer_name',
        'sale_date',
        'total_amount',
        'payment_method',
        'status',
        'created_at',
        'updated_at'
    ];

    // Sale belongs to user
    public function user()
    {
        return $this->belongsTo(
            User::class,
            'sale_id',
            'sale_id'
        );
    }

    //Sale has many details
    public function detail()
    {
        return $this->hasMany(
            SaleDetail::class,
            'sale_id',
            'sale_id'
        );
    }
}
