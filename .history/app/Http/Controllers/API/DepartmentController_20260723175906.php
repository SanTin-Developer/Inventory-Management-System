<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepartmentRequest;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\Department;
use Exception;
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
            ->orderByRaw("TO_NUMBER(REGEXP_SUBSTR(department_code, '[0-9]+')) DESC")
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
            ->orderByRaw("TO_NUMBER(REGEXP_SUBSTR(department_code, '[0-9]+')) DESC")
            ->get();

        return response()->json($departments);
    }

    public function store(StoreDepartmentRequest $request)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();
            unset($validated['department_code']);

            $validated['department_code'] = 'TMP-' . uniqid();
            $department = Department::create($validated);

            $department->department_code = 'D-' . $department->department_id;
            $department->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Department created successfully.',
                'data' => $department,
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function generateUniqueDepartmentCode(): string
    {
        do {
            $code = 'D-' . random_int(10000, 99999);
        } while (Department::where('department_code', $code)->exists());

        return $code;
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
