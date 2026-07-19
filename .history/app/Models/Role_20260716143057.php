<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';

    protected $primaryKey = 'role_id';

    public $timestamps = false;

    protected $fillable = [
        'role_name',
        'description',
        'created_at',
        'updated_at',
    ];

    // Role has many users
    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }
}
