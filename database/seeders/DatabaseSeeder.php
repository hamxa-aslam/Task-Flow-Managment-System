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
        

        User::factory()->create([
            'name' => 'Hamza Aslam',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Sofia Malik',
            'email' => 'manager@example.com',
            'password' => 'password123',
            'role' => 'manager',
        ]);

        User::factory()->create([
            'name' => 'Ali Raza',
            'email' => 'member@example.com',
            'password' => 'password123',
            'role' => 'team_member',
        ]);
    }
}