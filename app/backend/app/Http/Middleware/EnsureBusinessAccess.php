<?php

namespace App\Http\Middleware;

use App\Models\Business;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusinessAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (in_array($user->role, ['admin', 'owner'], true)) {
            return $next($request);
        }

        $business = $request->route('business');
        if (! $business instanceof Business) {
            return response()->json(['message' => 'Business context is required.'], 422);
        }

        $expectedSlug = str_replace('-staff', '', $user->role);

        if ($business->slug !== $expectedSlug) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
