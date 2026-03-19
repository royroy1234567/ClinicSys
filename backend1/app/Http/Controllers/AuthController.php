<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\clinic_users;
use App\Models\patients;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $clinicUser = clinic_users::where('email', $request->email)
                ->where('status', 'Active')
                ->first();

            if ($clinicUser && Hash::check($request->password, $clinicUser->password)) {
                $token = $clinicUser->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'token'   => $token,
                    'user'    => [
                        'id'             => $clinicUser->user_id,
                        'name'           => trim($clinicUser->first_name . ' ' . $clinicUser->last_name),
                        'email'          => $clinicUser->email,
                        'role'           => strtolower($clinicUser->role),
                        'specialization' => $clinicUser->specialization,
                        'contact_number' => $clinicUser->contact_number,
                        'user_id'        => $clinicUser->user_id,
                        'first_name'     => $clinicUser->first_name,
                        'last_name'      => $clinicUser->last_name,
                        'license_number' => $clinicUser->license_number,
                    ],
                ])->cookie('auth_token', $token, 60 * 24, '/', null, false, true, false, 'Lax');
                //                                                         ↑ false=dev only  ↑ Lax
            }

            $patient = patients::where('email', $request->email)->first();

            if ($patient && Hash::check($request->password, $patient->password)) {
                $token = $patient->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'token'   => $token,
                    'user'    => [
                        'id'         => $patient->id,
                        'user_id'    => $patient->id,
                        'name'       => trim($patient->first_name . ' ' . $patient->last_name),
                        'first_name' => $patient->first_name,
                        'last_name'  => $patient->last_name,
                        'email'      => $patient->email,
                        'role'       => 'patient',
                    ],
                ])->cookie('auth_token', $token, 60 * 24, '/', null, false, true, false, 'Lax');
            }

            return response()->json(['success' => false, 'message' => 'Invalid credentials.'], 401);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Login error: ' . $e->getMessage()], 500);
        }
    }

    public function logout(Request $request)
    {
        $token = $request->cookie('auth_token');

        if ($token) {
            \Laravel\Sanctum\PersonalAccessToken::findToken($token)?->delete();
        } elseif ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['success' => true, 'message' => 'Logged out.'])
            ->cookie('auth_token', '', -1, '/', null, false, true, false, 'Lax');
    }

    // ← DAGDAG ITO
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id'             => $user->user_id ?? $user->id,
                'user_id'        => $user->user_id ?? $user->id,
                'name'           => trim($user->first_name . ' ' . $user->last_name),
                'email'          => $user->email,
                'role'           => strtolower($user->role ?? 'patient'),
                'first_name'     => $user->first_name,
                'last_name'      => $user->last_name,
                'specialization' => $user->specialization ?? null,
                'contact_number' => $user->contact_number ?? null,
                'license_number' => $user->license_number ?? null,
            ],
        ]);
    }

    public function verifyPassword(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Incorrect password. Please try again.'], 403);
        }

        return response()->json(['success' => true, 'message' => 'Password verified.']);
    }
}