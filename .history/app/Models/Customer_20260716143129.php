<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';

    protected $primaryKey = 'customer_id';

    public $timestamps = false;

    protected $fillable = [
        'customer_name',
        'phone',
        'email',
        'address',
        'created_at',
        'updated_at',
    ];

    Uncomment once/if `sales` gets a customer_id column linking to this table.
    Right now Sale stores a plain `customer_name` string instead of a relation.
    public function sales()
    {
        return $this->hasMany(Sale::class, 'customer_id', 'customer_id');
    }
}
