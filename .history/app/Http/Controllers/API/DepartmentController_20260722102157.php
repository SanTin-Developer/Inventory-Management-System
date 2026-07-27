<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepartmentRequest;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->search;

        $departments = Department::query()
            ->withCount('users')
            ->when($keyword, function ($query) use ($keyword) {
                $query->where('department_name', 'like', "%{$keyword}%");
            })
            ->orderBy('department_name')
            ->paginate($request->input('per_page', 10));

        return response()->json($departments);
    }

    public function all(Request $request)
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

    public function store(StoreDepartmentRequest $request)
    {
        DB::beginTransaction();

        try

        return response()->json($department, 201);
    }

    public function show(Department $department)
    {
        return $department->loadCount('users');
    }

    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        $department->update($request->validated());

        return response()->json($department);
    }

    public function destroy(Department $department)
    {
        if ($department->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a department that still has users assigned to it.',
            ], 409);
        }

        $department->delete();

        return response()->json(['message' => 'Department deleted.']);
    }
}
