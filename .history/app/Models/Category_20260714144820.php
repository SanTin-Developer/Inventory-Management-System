<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    //
    protected $table = 'categories';

    protected $primaryKey = 'category_id';

    public $timestamps = false;

    protected $fillable = [
        'category_name',
        'description',
        'created_at',
        'updated_at',
    ];

    // Category has many products
    public function products()
    {
        return $this -> hasMany(
            Product::class
        )
    }
}
