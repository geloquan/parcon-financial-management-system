<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $headerToken = $request->bearerToken();

        if (! $headerToken) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $users = User::query()->whereNotNull('api_token')->get();

        $authenticatedUser = $users->first(function (User $user) use ($headerToken): bool {
            return Hash::check($headerToken, $user->api_token);
        });

        if (! $authenticatedUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->setUserResolver(fn (): User => $authenticatedUser);

        return $next($request);
    }
}
