<?php

namespace App\Http\Controllers;

use App\Models\clinic_users;
use App\Models\ClinicUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClinicUsersController extends Controller
{
    public function index(Request $request)
    {
        $query = clinic_users::query();

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$request->search}%"])
                  ->orWhere('username', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->role && $request->role !== 'All Roles') {
            $query->where('role', $request->role);
        }

        if ($request->status && $request->status !== 'All Status') {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

public function store(Request $request)
{
    $request->validate([
        'first_name'     => 'required|string|max:50',
        'last_name'      => 'required|string|max:50',
        'username'       => 'required|string|max:50|unique:clinic_users',
        'email'          => 'required|email|max:100|unique:clinic_users',
        'contact_number' => 'nullable|string|max:20',
        'specialization' => 'nullable|string|max:100',
        'license_number' => 'nullable|string|max:50',
        'role'           => 'required|in:Manager,Admin,Doctor,Staff',
        'status'         => 'nullable|in:Active,Inactive',
        'password'       => 'required|string|min:8',
    ]);


        [$first, $last] = array_pad(explode(' ', $request->name, 2), 2, '');

        $user = clinic_users::create([
        'first_name'     => $request->first_name,
        'last_name'      => $request->last_name,
        'username'       => $request->username,
        'email'          => $request->email,
        'contact_number' => $request->contact_number,
        'specialization' => $request->specialization,
        'license_number' => $request->license_number,
        'role'           => $request->role,
        'status'         => $request->status ?? 'Active',
        'password'       => Hash::make($request->password),
        ]);

        return response()->json($this->formatUser($user), 201);
    }

    public function update(Request $request, $id)
    {
        $user = clinic_users::findOrFail($id);

      $request->validate([
        'first_name'     => 'required|string|max:50',
        'last_name'      => 'required|string|max:50',
        'username'       => 'required|string|max:50|unique:clinic_users,username,'.$id.',user_id',
        'email'          => 'required|email|max:100|unique:clinic_users,email,'.$id.',user_id',
        'contact_number' => 'nullable|string|max:20',
        'specialization' => 'nullable|string|max:100',
        'license_number' => 'nullable|string|max:50',
        'role'           => 'required|in:Manager,Admin,Doctor,Staff',
        'status'         => 'nullable|in:Active,Inactive',
    ]);

        [$first, $last] = array_pad(explode(' ', $request->name, 2), 2, '');

 $user->update([
        'first_name'     => $request->first_name,
        'last_name'      => $request->last_name,
        'username'       => $request->username,
        'email'          => $request->email,
        'contact_number' => $request->contact_number,
        'specialization' => $request->specialization,
        'license_number' => $request->license_number,
        'role'           => $request->role,
        'status'         => $request->status ?? $user->status,
    ]);

        return response()->json($this->formatUser($user));
    }

    public function destroy($id)
    {
        clinic_users::findOrFail($id)->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function toggleStatus($id)
    {
        $user = clinic_users::findOrFail($id);
        $user->status = $user->status === 'Active' ? 'Inactive' : 'Active';
        $user->save();
        return response()->json($this->formatUser($user));
    }

    private function formatUser(clinic_users $user): array
    {
return [
        'user_id'        => $user->user_id,
        'first_name'     => $user->first_name,
        'last_name'      => $user->last_name,
        'username'       => $user->username,
        'email'          => $user->email,
        'contact_number' => $user->contact_number,
        'specialization' => $user->specialization,
        'license_number' => $user->license_number,
        'role'           => $user->role,
        'status'         => $user->status,
        'created_at'     => $user->created_at,
    ];
    }
}