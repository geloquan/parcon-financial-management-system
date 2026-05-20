<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'owner', 'staff', 'coffee-staff', 'print-staff', 'ethereal-staff'];

        foreach ($roles as $role) {
            Role::findOrCreate($role);
        }

        User::query()->whereNotNull('role')->chunkById(100, function ($users): void {
            foreach ($users as $user) {
                if ($user->getRoleNames()->isNotEmpty()) {
                    continue;
                }

                $legacyRole = $user->role;
                if (! is_string($legacyRole) || $legacyRole === '') {
                    continue;
                }

                Role::findOrCreate($legacyRole);
                $user->syncRoles([$legacyRole]);
            }
        });
    }
}
