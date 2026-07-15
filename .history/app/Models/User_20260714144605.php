<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Auth\Authenticatable as AuthenticatableTrait;

class User extends Model
{
    //

    use AuthenticatableTrait, Notifiable;

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
    ];

    // never expose these when the model is serialized to JSON/array
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Auto-hash password + cast types safely
    protected function casts(): array
    {
        return [
            'password' => 'hashed', // Laravel 10.17+ auto-hashes on set
            'status' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // User creates many purchases
    public function purchases()
    {
        return $this->hasMany(
            Sale::class,
            'user_id',
            
        )
    }
}
