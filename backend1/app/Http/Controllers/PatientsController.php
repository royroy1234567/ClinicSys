<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\patients;
use Illuminate\Support\Facades\Hash;

class PatientsController extends Controller
{
    public function index()
    {
        return response()->json(patients::orderBy('created_at', 'desc')->get());
    }

    public function checkEmail(Request $request)
    {
        $exists = patients::where('email', $request->email)->exists();
        return response()->json(['exists' => $exists]);
    }

    // ── GET /api/patient/profile ──────────────────────────────
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    // ── PUT /api/patient/profile ──────────────────────────────
    public function updateProfile(Request $request)
    {
        $patient = $request->user();

        $request->validate([
            'first_name'             => 'sometimes|string|max:255',
            'middle_name'            => 'nullable|string|max:255',
            'last_name'              => 'sometimes|string|max:255',
            'dob'                    => 'sometimes|date|before:today',
            'gender'                 => 'sometimes|string',
            'civil_status'           => 'nullable|string',
            'nationality'            => 'nullable|string',
            'mobile'                 => 'sometimes|string|max:20',
            'street'                 => 'sometimes|string',
            'city'                   => 'sometimes|string',
            'province'               => 'sometimes|string',
            'blood_type'             => 'nullable|string|max:10',
            'allergies'              => 'nullable|string',
            'conditions'             => 'nullable|string',
            'medications'            => 'nullable|string',
            'emergency_name'         => 'sometimes|string|max:255',
            'emergency_relationship' => 'sometimes|string|max:255',
            'emergency_contact'      => 'sometimes|string|max:20',
        ]);

        // Never allow email or password update through this endpoint
        $patient->update($request->except(['email', 'password', 'agree_privacy', 'agree_storage']));

        return response()->json($patient->fresh());
    }

    // ── PUT /api/patient/password ─────────────────────────────
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $patient = $request->user();

        if (!Hash::check($request->current_password, $patient->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $patient->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated successfully.'], 200);
    }

    public function register(Request $request)
    {
        $request->validate([
            'first_name'             => 'required|string|max:255',
            'middle_name'            => 'nullable|string|max:255',
            'last_name'              => 'required|string|max:255',
            'dob'                    => 'required|date|before:today',
            'age'                    => 'required|integer|min:0',
            'gender'                 => 'required|string',
            'civil_status'           => 'nullable|string',
            'nationality'            => 'nullable|string',
            'mobile'                 => 'required|string|max:20',
            'email'                  => 'required|string|email|unique:patients,email',
            'street'                 => 'required|string',
            'city'                   => 'required|string',
            'province'               => 'required|string',
            'password'               => 'required|string|min:8|confirmed',
            'blood_type'             => 'nullable|string|max:10',
            'allergies'              => 'nullable|string',
            'conditions'             => 'nullable|string',
            'medications'            => 'nullable|string',
            'emergency_name'         => 'required|string|max:255',
            'emergency_relationship' => 'required|string|max:255',
            'emergency_contact'      => 'required|string|max:20',
            'agree_privacy'          => 'accepted',
            'agree_storage'          => 'accepted',
        ]);

        $patient = patients::create([
            'first_name'             => $request->first_name,
            'middle_name'            => $request->middle_name,
            'last_name'              => $request->last_name,
            'dob'                    => $request->dob,
            'age'                    => $request->age,
            'gender'                 => $request->gender,
            'civil_status'           => $request->civil_status,
            'nationality'            => $request->nationality,
            'mobile'                 => $request->mobile,
            'email'                  => $request->email,
            'street'                 => $request->street,
            'city'                   => $request->city,
            'province'               => $request->province,
            'password'               => Hash::make($request->password),
            'blood_type'             => $request->blood_type,
            'allergies'              => $request->allergies,
            'conditions'             => $request->conditions,
            'medications'            => $request->medications,
            'emergency_name'         => $request->emergency_name,
            'emergency_relationship' => $request->emergency_relationship,
            'emergency_contact'      => $request->emergency_contact,
            'agree_privacy'          => $request->agree_privacy,
            'agree_storage'          => $request->agree_storage,
        ]);

        $token = $patient->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Patient registered successfully',
            'token'   => $token,
            'user'    => [
                'id'         => $patient->id,
                'first_name' => $patient->first_name,
                'last_name'  => $patient->last_name,
                'email'      => $patient->email,
            ],
        ], 201);
    }
}