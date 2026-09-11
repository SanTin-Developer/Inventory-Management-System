<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $table = 'departments';

    protected $primaryKey = 'department_id';

    public $timestamps = false;

    protected $fillable = [
        'department_code',
        'department_name',
        'description',
        'created_at',
        'updated_at',
    ];

    // Department has many staff/managers
    public function users()
    {
        return $this->hasMany(User::class, 'department_id', 'department_id');
    }
}
