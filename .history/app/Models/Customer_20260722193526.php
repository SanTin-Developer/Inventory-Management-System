<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, Auditable;

    protected $table = 'customers';

    protected $primaryKey = 'customer_id';

    public $timestamps = false;

    protected $fillable = [
        'customer_code',
        'customer_name',
        'phone',
        'email',
        'address',
        'created_at',
        'updated_at',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class, 'customer_id', 'customer_id');
    }
}
