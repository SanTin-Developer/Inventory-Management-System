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
        'role_code',
        'role_name',
        'description',
        'default_salary_min',
        'default_salary_max',
        'created_at',
        'updated_at',
    ];

    // Role has many users
    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }
}
