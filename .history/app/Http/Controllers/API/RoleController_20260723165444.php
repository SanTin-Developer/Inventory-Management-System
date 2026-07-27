<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use Illuminate\Http\Request;
use App\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->search;

        $roles = Role::query()
            ->withCount('users')
            ->when($keyword, function ($query) use ($keyword) {
                $query->where('role_name', 'like', "%{$keyword}%");
            })
            ->orderByDesc('role_id')   // ← sort by ID instead of name
            ->paginate($request->input('per_page', 10));

        return response()->json($roles);
    }

    public function all(Request $request)
    {
        $keyword = $request->search;

        $roles = Role::query()
            ->when($keyword, function ($query) use ($keyword) {
                $query->where('role_name', 'like', "%{$keyword}%");
            })
            ->orderByDesc('role_name')
            ->get();

        return response()->json($roles);
    }

    public function store(StoreRoleRequest $request)
    {
        $validated = $request->validated();
        unset($validated['role_code']); // never trust client-supplied code

        $validated['role_code'] = 'TMP-' . uniqid();
        $role = Role::create($validated);

        $role->role_code = 'R-' . $role->role_id;
        $role->save();

        return response()->json($role, 201);
    }

    public function show(Role $role)
    {
        return $role->loadCount('users');
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $role->update($request->validated());

        return response()->json($role);
    }

    public function destroy(Role $role)
    {
        if ($role->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a role that still has users assigned to it.',
            ], 409);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    public function updateSalaryRange(Request $request, Role $role)
    {
        $validated = $request->validate([
            'default_salary_min' => ['required', 'numeric', 'min:0'],
            'default_salary_max' => ['required', 'numeric', 'gte:default_salary_min'],
        ]);

        $role->update($validated);

        return response()->json($role->fresh());
    }
}
