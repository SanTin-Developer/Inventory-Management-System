<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\CloudinaryImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(protected CloudinaryImageService $images) {}

    public function index()
    {
        return User::with(['department', 'role'])->paginate(10);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        if ($request->hasFile('image')) {
            $data['image_url'] = $this->images->upload($request->file('image'));
        }

        $user = User::create($data);

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

        $user->update($data);

        return response()->json($user->load(['department', 'role']));
    }

    public function destroy(User $user)
    {
        $this->images->delete($user->image_url);
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
