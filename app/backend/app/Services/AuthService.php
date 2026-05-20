<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(string $username, string $password): array
    {
        $user = User::query()->where('username', $username)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        $plainToken = bin2hex(random_bytes(32));
        $user->forceFill(['api_token' => Hash::make($plainToken)])->save();

        return [$user, $plainToken];
    }

    public function logout(User $user): void
    {
        $user->forceFill(['api_token' => null])->save();
    }
}
