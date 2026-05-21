<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        foreach ([
            [
                'name' => 'Coffee shop',
                'slug' => 'coffee',
                'description' => 'Coffee business',
            ],
            [
                'name' => 'Print shop',
                'slug' => 'print',
                'description' => 'Print business',
            ],
            [
                'name' => 'Ethereal',
                'slug' => 'ethereal',
                'description' => 'Beauty salon business',
            ],
            [
                'name' => 'GCash',
                'slug' => 'gcash',
                'description' => 'GCash transaction business',
            ],
        ] as $business) {
            Business::query()->updateOrCreate(
                ['slug' => $business['slug']],
                $business
            );
        }

        User::query()->updateOrCreate([
            'username' => 'marco',
        ], [
            'name' => 'Marco Admin',
            'email' => 'marco@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $marco = User::query()->where('username', 'marco')->first();
        $marco?->syncRoles(['admin']);
    }
}
