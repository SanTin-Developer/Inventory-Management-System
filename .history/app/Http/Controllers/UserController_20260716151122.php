<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\CloudinaryImageService;
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
