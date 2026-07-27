<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    //
    use HasFactory, Auditable;

    protected $table = 'sales';

    protected $primaryKey = 'sale_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'customer_id',
        'customer_name',
        'sale_date',
        'total_amount',
        'discount_amount',
        'payment_method',
        'status',
        'created_at',
        'updated_at'
    ];

    // Sale belongs to user (who recorded it)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // Sale has many line items
    public function details()
    {
        return $this->hasMany(SaleDetail::class, 'sale_id', 'sale_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }
}
