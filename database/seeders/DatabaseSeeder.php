<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@yourcompany.com',
            'password' => 'ChangeMe123!', // auto-hashed via the 'hashed' cast
            'role' => 'Admin',
            'status' => 'Active',
        ]);
    }
}
