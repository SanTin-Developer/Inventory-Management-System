<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CanManageSalaryRanges
{
    // Separate from the broader role:Admin gate — this specifically
    // controls who can set/change a ROLE's salary band (not who can
    // create/delete roles entirely, which stays Admin-only).
    protected array $allowedRoles = ['Admin', 'Manager', 'HR Officer'];

    public function handle(Request $request, Closure $next)
    {
        $roleName = $request->user()?->role?->role_name;

        if (! in_array($roleName, $this->allowedRoles, true)) {
            return response()->json([
                'message' => 'You are not authorized to manage salary ranges.',
            ], 403);
        }

        return $next($request);
    }
}
