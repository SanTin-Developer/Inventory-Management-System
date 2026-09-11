<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show($key)
    {
        $setting = Setting::where('key', $key)->first();

        return response()->json($setting ? json_decode($setting->value, true) : null);
    }

    public function update(Request $request, $key)
    {
        // Server-side enforcement — never trust the frontend role check alone
        if ($request->user()->role?->role_name !== 'Admin') {
            return response()->json(['message' => 'Only admins can update this.'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'telegram' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
        ]);

        Setting::updateOrCreate(['key' => $key], ['value' => json_encode($validated)]);

        return response()->json(['success' => true, 'data' => $validated]);
    }
}
