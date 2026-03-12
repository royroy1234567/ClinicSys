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
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            // 1. Try clinic_users first (Manager, Admin, Doctor, Staff)
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
                    ],
                ]);
            }

            // 2. Try patients table
            $patient = patients::where('email', $request->email)->first();

            if ($patient && Hash::check($request->password, $patient->password)) {
                $token = $patient->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'token'   => $token,
                    'user'    => [
                        'id'    => $patient->id,
                        'name'  => trim($patient->first_name . ' ' . $patient->last_name),
                        'email' => $patient->email,
                        'role'  => 'patient',
                    ],
                ], 200);
            }

            // 3. No match found
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out.']);
    }

    /**
     * Verify the currently authenticated user's password.
     * Used by the frontend password-gate before accessing Manage User modal.
     *
     * POST /api/auth/verify-password
     * Body: { "password": "..." }
     * Auth: Bearer token required
     */
    public function verifyPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Incorrect password. Please try again.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password verified.',
        ]);
    }
}