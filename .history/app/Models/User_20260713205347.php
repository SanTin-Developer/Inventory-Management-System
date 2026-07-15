<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth

class User extends Model
{
    //
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
}
