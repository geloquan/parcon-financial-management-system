<?php

namespace App\Http\Requests\Concerns;

use Closure;
use Illuminate\Support\Facades\Hash;

trait HasMoneyReauthRules
{
    protected function moneyReauthRules(): array
    {
        return [
            'reauth_username' => [
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $user = $this->user();

                    if (! $user || $value !== $user->username) {
                        $fail('Re-authentication credentials are invalid.');
                    }
                },
            ],
            'reauth_password' => [
                'required',
                'string',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $user = $this->user();

                    if (! $user || ! Hash::check((string) $value, (string) $user->password)) {
                        $fail('Re-authentication credentials are invalid.');
                    }
                },
            ],
        ];
    }
}
