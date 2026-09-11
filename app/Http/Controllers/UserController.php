<?php

namespace App\Http\Controllers;

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
                $needle = '%'.$this->escapeLike($keyword).'%';
                $query->where(function ($q) use ($needle) {
                    $q->where('name', 'like', $needle)
                        ->orWhere('email', 'like', $needle)
                        ->orWhere('phone', 'like', $needle);
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
        unset($data['user_code']); // never trust client-supplied code
        unset($data['image']);     // raw upload key isn't a DB column, drop it

        $data['password'] = Hash::make($data['password']);
        $data['status'] = $data['status'] ?? 'Active';
        $data['user_code'] = 'TMP-'.uniqid(); // temp placeholder until we know user_id

        $uploadedPath = null;
        if ($request->hasFile('image')) {
            $uploadedPath = $this->images->upload($request->file('image'));
            $data['image_url'] = $uploadedPath;
        }

        try {
            $user = User::create($data);

            $user->user_code = $this->generateUniqueUserCode();
            $user->save();
        } catch (QueryException $e) {
            if ($uploadedPath) {
                $this->images->delete($uploadedPath); // clean up orphaned file
            }

            if (str_contains($e->getMessage(), 'Salary must be between')) {
                return response()->json([
                    'message' => 'Salary is outside the allowed range for this role.',
                    'errors' => ['salary' => ['Salary is outside the allowed range for this role.']],
                ], 422);
            }

            throw $e;
        }

        return response()->json($user->load(['department', 'role']), 201);
    }

    private function generateUniqueUserCode(): string
    {
        do {
            $code = 'UR-'.random_int(10000, 99999);
        } while (User::where('user_code', $code)->exists());

        return $code;
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

        // Password verification is a re-auth step for the CURRENT account only —
        // it must never be used to brute-force another user's password.
        if ($request->user()->user_id !== $user->user_id) {
            return response()->json([
                'message' => 'You can only verify your own password.',
            ], 403);
        }

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        return response()->json([
            'message' => 'Password verified.',
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
            'total' => (int) $counts->total,
            'active' => (int) $counts->active,
            'inactive' => (int) $counts->inactive,
            'on_leave' => (int) $counts->on_leave,
            'terminated' => (int) $counts->terminated,
            'admin_count' => (int) $adminCount,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();
        unset($data['image']); // raw upload key isn't a DB column, drop it

        if (! empty($data['password'])) {
            if ($request->user()->user_id !== $user->user_id) {
                return response()->json([
                    'message' => 'You can only change your own password.',
                    'errors' => ['password' => ['You can only change your own password.']],
                ], 422);
            }
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $oldImageUrl = null;
        if ($request->hasFile('image')) {
            // Upload the new image BEFORE deleting the old one, so a failed
            // upload never leaves the user pointing at a deleted image.
            $data['image_url'] = $this->images->upload($request->file('image'));
            $oldImageUrl = $user->image_url;
        }

        try {
            $user->update($data);
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Salary must be between')) {
                return response()->json([
                    'message' => 'Salary is outside the allowed range for this role.',
                    'errors' => ['salary' => ['Salary is outside the allowed range for this role.']],
                ], 422);
            }
            throw $e;
        }

        if ($oldImageUrl !== null) {
            try {
                $this->images->delete($oldImageUrl);
            } catch (\Throwable $e) {
                \Log::warning('Failed to delete old user image: '.$e->getMessage());
            }
        }

        return response()->json($user->load(['department', 'role']));
    }

    public function destroy(User $user)
    {
        try {
            $user->delete();
        } catch (QueryException $e) {
            \Log::warning('User deletion failed: '.$e->getMessage());

            return response()->json([
                'message' => 'User cannot be deleted because they are referenced by sales, purchases, or other records.',
            ], 409);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Something went wrong while deleting the user.',
            ], 500);
        }

        try {
            $this->images->delete($user->image_url);
        } catch (\Throwable $e) {
            \Log::warning('Failed to delete user image during user deletion: '.$e->getMessage());
        }

        return response()->json(['message' => 'User deleted.']);
    }
}
