<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class EnsurePortfolioReauth
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $username = (string) $request->input('reauth_username');
        $password = (string) $request->input('reauth_password');

        if ($username === '' || $password === '') {
            return response()->json([
                'message' => 'Re-authentication is required.',
                'errors' => [
                    'reauth_username' => ['The reauth_username field is required.'],
                    'reauth_password' => ['The reauth_password field is required.'],
                ],
            ], 422);
        }

        if ($username !== $user->username || ! Hash::check($password, $user->password)) {
            return response()->json([
                'message' => 'Re-authentication credentials are invalid.',
            ], 422);
        }

        return $next($request);
    }
}
