<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\patients;
use Illuminate\Support\Facades\Hash;

class PatientsController extends Controller
{
    /**
     * POST /api/register
     * Register a new patient.
     */

    public function checkEmail(Request $request)
{
    $exists = patients::where('email', $request->email)->exists();
    return response()->json(['exists' => $exists]);
}
    public function register(Request $request)
    {
        $request->validate([
            // Personal Info
            'first_name'             => 'required|string|max:255',
            'middle_name'            => 'nullable|string|max:255',
            'last_name'              => 'required|string|max:255',
            'dob'                    => 'required|date|before:today',
            'age'                    => 'required|integer|min:0',
            'gender'                 => 'required|string',
            'civil_status'           => 'nullable|string',
            'nationality'            => 'nullable|string',

            // Contact Info
            'mobile'                 => 'required|string|max:20',
            'email'                  => 'required|string|email|unique:patients,email',
            'street'                 => 'required|string',
            'city'                   => 'required|string',
            'province'               => 'required|string',

            // Account Credentials
            'password'               => 'required|string|min:8|confirmed',

            // Medical Info
            'blood_type'             => 'nullable|string|max:10',
            'allergies'              => 'nullable|string',
            'conditions'             => 'nullable|string',
            'medications'            => 'nullable|string',

            // Emergency Contact
            'emergency_name'         => 'required|string|max:255',
            'emergency_relationship' => 'required|string|max:255',
            'emergency_contact'      => 'required|string|max:20',

            // Consent
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
            'password'               => Hash::make($request->password), // ✅ hashed
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
            'token'   => $token,           // ✅ matches React: data.token
            'user'    => [                 // ✅ matches React: data.user
                'id'         => $patient->id,
                'first_name' => $patient->first_name,
                'last_name'  => $patient->last_name,
                'email'      => $patient->email,
              
            ],
        ], 201);
    }
}