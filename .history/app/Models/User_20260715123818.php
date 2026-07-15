<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory;

    protected $table = 'users';

    protected $primaryKey = 'user_id';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'status',
        'created_at',
        'updated_at',
    ];

    // Never expose password in JSON responses
    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // User has recorded many purchases
    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'user_id', 'user_id');
    }

    // User has recorded many sales
    public function sales()
    {
        return $this->hasMany(Sale::class, 'user_id', 'user_id');
    }
}
