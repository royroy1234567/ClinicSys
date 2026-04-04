<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\patients;
use Carbon\Carbon;
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
            'first_name'             => ['sometimes', 'string', 'max:255', 'regex:/^([^\d]+)?$/'],
            'middle_name'            => ['nullable', 'string', 'max:255', 'regex:/^([^\d]+)?$/'],
            'last_name'              => ['sometimes', 'string', 'max:255', 'regex:/^([^\d]+)?$/'],
            'dob'                    => [
                'sometimes',
                'date',
                'before_or_equal:today',
                function ($attribute, $value, $fail) {
                    if (Carbon::parse($value)->age < 18) {
                        $fail('Patient must be at least 18 years old.');
                    }
                },
            ],
            'gender'                 => 'sometimes|string',
            'civil_status'           => 'nullable|string',
            'nationality'            => 'nullable|string',
            'mobile'                 => ['sometimes', 'string', 'regex:/^\+63\d{10}$/'],
            'street'                 => 'sometimes|string',
            'city'                   => 'sometimes|string',
            'province'               => 'sometimes|string',
            'blood_type'             => 'nullable|string|max:10',
            'allergies'              => 'nullable|string',
            'conditions'             => 'nullable|string',
            'medications'            => 'nullable|string',
            'emergency_name'         => ['sometimes', 'string', 'max:255', 'regex:/^([^\d]+)?$/'],
            'emergency_relationship' => 'sometimes|string|max:255',
            'emergency_contact'      => ['sometimes', 'string', 'regex:/^\+63\d{10}$/'],
        ], [
            'first_name.regex' => 'Numbers are not allowed in first name.',
            'middle_name.regex' => 'Numbers are not allowed in middle name.',
            'last_name.regex' => 'Numbers are not allowed in last name.',
            'emergency_name.regex' => 'Numbers are not allowed in emergency contact name.',
            'mobile.regex' => 'Mobile number must be in +63 format followed by 10 digits.',
            'emergency_contact.regex' => 'Emergency contact number must be in +63 format followed by 10 digits.',
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

    // ── PATCH /api/patients/{id}/toggle-status ────────────────
    public function toggleStatus(Request $request, $id)
    {
        $patient = patients::findOrFail($id);

        $patient->status = $patient->status === 'active' ? 'inactive' : 'active';
        $patient->save();

        return response()->json([
            'message' => 'Status updated successfully.',
            'status'  => $patient->status,
        ]);
    }

    // ── POST /api/patients/verify-password ───────────────────
    // Used by the admin UI to gate the View modal behind a password check.
    // Expects { password: string } and checks against the authenticated admin/staff user.
    public function verifyAdminPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $admin = $request->user(); // the currently logged-in admin / staff

        if (!Hash::check($request->password, $admin->password)) {
            return response()->json(['verified' => false, 'message' => 'Incorrect password.'], 422);
        }

        return response()->json(['verified' => true]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'first_name'             => ['required', 'string', 'max:255', 'regex:/^[^\d]+$/'],
            'middle_name'            => ['nullable', 'string', 'max:255', 'regex:/^([^\d]+)?$/'],
            'last_name'              => ['required', 'string', 'max:255', 'regex:/^[^\d]+$/'],
            'dob'                    => [
                'required',
                'date',
                'before_or_equal:today',
                function ($attribute, $value, $fail) {
                    if (Carbon::parse($value)->age < 18) {
                        $fail('You must be at least 18 years old to register.');
                    }
                },
            ],
            'age'                    => 'required|integer|min:0',
            'gender'                 => 'required|string',
            'civil_status'           => 'nullable|string',
            'nationality'            => 'nullable|string',
            'mobile'                 => ['required', 'string', 'regex:/^\+63\d{10}$/'],
            'email'                  => 'required|string|email|unique:patients,email',
            'street'                 => 'required|string',
            'city'                   => 'required|string',
            'province'               => 'required|string',
            'password'               => 'required|string|min:8|confirmed',
            'blood_type'             => 'nullable|string|max:10',
            'allergies'              => 'nullable|string',
            'conditions'             => 'nullable|string',
            'medications'            => 'nullable|string',
            'emergency_name'         => ['required', 'string', 'max:255', 'regex:/^[^\d]+$/'],
            'emergency_relationship' => 'required|string|max:255',
            'emergency_contact'      => ['required', 'string', 'regex:/^\+63\d{10}$/'],
            'agree_privacy'          => 'accepted',
            'agree_storage'          => 'accepted',
        ], [
            'first_name.regex' => 'Numbers are not allowed in first name.',
            'middle_name.regex' => 'Numbers are not allowed in middle name.',
            'last_name.regex' => 'Numbers are not allowed in last name.',
            'emergency_name.regex' => 'Numbers are not allowed in emergency contact name.',
            'mobile.regex' => 'Mobile number must be in +63 format followed by 10 digits.',
            'emergency_contact.regex' => 'Emergency contact number must be in +63 format followed by 10 digits.',
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
            'status'                 => 'active',
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