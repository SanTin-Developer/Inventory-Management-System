<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\CloudinaryImageService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(protected CloudinaryImageService $images) {}

    public function index(Request $request)
    {
        $keyword = $request->search;
        $roleId = $request->role_id;
        $departmentId = $request->department_id;
        $status = $request->status;

        $users = User::query()
            ->with(['role', 'department'])
            ->when($keyword, function ($query) use ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%")
                        ->orWhere('phone', 'like', "%{$keyword}%");
                });
            })
            ->when($roleId, function ($query) use ($roleId) {
                $query->where('role_id', $roleId);
            })
            ->when($departmentId, function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderBy('user_id', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json($users);
    }
    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        if ($request->hasFile('image')) {
            $data['image_url'] = $this->images->upload($request->file('image'));
        }

        try {
            $user = User::create($data);
        } catch (QueryException $e) {
            // ORA-20001 is the custom error raised by
            // trg_users_salary_range_check when salary falls outside
            // the selected role's allowed range.
            if (str_contains($e->getMessage(), 'ORA-20001')) {
                return response()->json([
                    'message' => 'Salary is outside the allowed range for this role.',
                    'errors' => ['salary' => ['Salary is outside the allowed range for this role.']],
                ], 422);
            }

            throw $e; // anything else is a real, unexpected error
        }

        return response()->json($user->load(['department', 'role']), 201);
    }

    public function show(User $user)
    {
        return $user->load(['department', 'role']);
    }

    public function verifyPassword(Request $request, User $user)
    {
        $request->validate([
            'current_password' => ['required'],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.'
            ], 422);
        }

        return response()->json([
            'message' => 'Password verified.'
        ]);
    }

    public function stats()
    {
        $counts = DB::table('users')
            ->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave,
            SUM(CASE WHEN status = 'Terminated' THEN 1 ELSE 0 END) as terminated
        ")
            ->first();

        $adminCount = DB::table('users')
            ->join('roles', 'roles.role_id', '=', 'users.role_id')
            ->where('roles.role_name', 'Admin')
            ->count();

        return response()->json([
            'total'       => (int) $counts->total,
            'active'      => (int) $counts->active,
            'inactive'    => (int) $counts->inactive,
            'on_leave'    => (int) $counts->on_leave,
            'terminated'  => (int) $counts->terminated,
            'admin_count' => (int) $adminCount,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if ($request->hasFile('image')) {
            // Replace: delete the old Cloudinary image before storing the new one
            $this->images->delete($user->image_url);
            $data['image_url'] = $this->images->upload($request->file('image'));
        }

        try {
            $user->update($data);
        } catch (QueryException $e) {
            // Same ORA-20001 check as store() — salary outside the
            // role's range, this time on an update instead of create.
            if (str_contains($e->getMessage(), 'ORA-20001')) {
                return response()->json([
                    'message' => 'Salary is outside the allowed range for this role.',
                    'errors' => ['salary' => ['Salary is outside the allowed range for this role.']],
                ], 422);
            }

            throw $e;
        }

        return response()->json($user->load(['department', 'role']));
    }

    public function destroy(User $user)
    {
        $this->images->delete($user->image_url);
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
