<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    //
    use HasFactory;

    protected $table = 'purchases';

    protected $primaryKey = 'purchase_id';

    public $timestamps = false;

    protected $fillable = [
        'supplier_id',
        'user_id',
        'purchase_date',
        'total_amount',
        'status',
        'created_at',
        'updated_at'
    ];

    // Purchase belongs to supplier
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'purchase_id', 'purchase_id');
    }

    // Purchase belongs to uses ( who reorderd it)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // Purchase has many details
    public function details()
    {
        return $this->hasMany(PurchaseDetail::class,
            'purchase_id',
            'purchase_id'
        );
    }
}
