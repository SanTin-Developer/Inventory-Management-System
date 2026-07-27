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

        $departments = Department::query()
            ->when($keyword, function ($query) use ($keyword) {
                $query->where('department_name', 'like', "%{$keyword}%");
            })
            ->orderBy('department_name')
            ->get();

        return response()->json($departments);
    }
    public function store(StoreRoleRequest $request)
    {
        $role = Role::create($request->validated());

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
