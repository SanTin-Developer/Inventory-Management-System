<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use Exception;

class UserController extends Controller
{
    // Get all users
    public function index(Request $request)
    {
        $keyword = $request->keyword;
        $role = $request->role;

        $users = User::query()
            ->when($keyword, function ($query) use ($keyword) {
                $query->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%");
            })
            ->when($role, function ($query) use ($role) {
                $query->where('role', $role);
            })
            ->orderBy('user_id', 'desc')
            ->paginate(10);

        return response()->json($users);
    }

    // Create user
    public function store(StoreUserRequest $request)
    {
        DB::beginTransaction();

        try {

            $user = User::create($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User created successfully.',
                'data' => $user
            ], 201);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Show user
    public function show(User $user)
    {
        return response()->json($user);
    }

    // Update user
    public function update(UpdateUserRequest $request, User $user)
    {
        DB::beginTransaction();

        try {

            $validated = $request->validated();

            // don't overwrite password with null if not provided
            if (empty($validated['password'])) {
                unset($validated['password']);
            }

            $user->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully.',
                'data' => $user
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Delete user
    public function destroy(User $user)
    {
        try {

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully.'
            ]);
        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'User cannot be deleted because they have recorded purchases or sales.'
            ], 500);
        }
    }
}
