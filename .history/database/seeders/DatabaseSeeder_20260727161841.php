<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
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
        $adminRole = Role::firstOrCreate(
            ['role_name' => 'Admin'],
            ['description' => 'System administrator with full access']
        );

        User::create([
            'name' => 'System Admin',
            'email' => 'admin@yourcompany.com',
            'password' => 'ChangeMe123!', // auto-hashed via the 'hashed' cast
            'role_id' => $adminRole->role_id,
            'status' => 'Active',
        ]);
    }
}
