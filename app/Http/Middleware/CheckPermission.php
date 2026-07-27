<?php

namespace App\Http\Middleware;

use App\Support\Permissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $roleName = $request->user()?->role?->role_name;
        $isWrite = ! in_array($request->method(), ['GET', 'HEAD'], true);

        $allowed = $isWrite
            ? Permissions::canWrite($resource, $roleName)
            : Permissions::canView($resource, $roleName);

        if (! $allowed) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
