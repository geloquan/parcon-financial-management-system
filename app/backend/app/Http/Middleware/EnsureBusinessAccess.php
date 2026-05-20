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

        if ($user->hasAnyRole(['admin', 'owner'])) {
            return $next($request);
        }

        $business = $request->route('business');
        if (! $business instanceof Business) {
            return response()->json(['message' => 'Business context is required.'], 422);
        }

        if ($user->hasRole('staff')) {
            if ($user->business_id !== $business->id) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }

            return $next($request);
        }

        $staffRole = $user->getRoleNames()
            ->first(fn (string $role): bool => str_ends_with($role, '-staff'));

        if (! $staffRole) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $expectedSlug = str_replace('-staff', '', $staffRole);

        if ($business->slug !== $expectedSlug) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
