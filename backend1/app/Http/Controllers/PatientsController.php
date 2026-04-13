<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\patients;
use App\Models\queue_entries;
use App\Models\PatientEmailVerification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\PatientEmailOtpMail;
use Illuminate\Support\Str;

class PatientsController extends Controller
{
    public function index()
    {
        $rows = patients::orderBy('created_at', 'desc')->get()->map(function (patients $patient) {
            $data = $patient->toArray();
            $data['public_id'] = $patient->public_id ?: $patient->buildPublicId();
            return $data;
        })->values();

        return response()->json($rows);
    }

    public function checkEmail(Request $request)
    {
        $exists = patients::where('email', $request->email)->exists();
        return response()->json(['exists' => $exists]);
    }

    public function sendEmailVerificationCode(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
        ]);

        $email = strtolower(trim((string) $request->email));
        if (patients::where('email', $email)->exists()) {
            return response()->json(['message' => 'This email is already registered.'], 422);
        }

        $otp = (string) random_int(100000, 999999);

        PatientEmailVerification::updateOrCreate(
            ['email' => $email],
            [
                'code_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes(10),
                'attempts' => 0,
                'verified_at' => null,
            ]
        );

        Mail::to($email)->send(new PatientEmailOtpMail($otp));

        return response()->json(['message' => 'Verification code sent.']);
    }

    public function verifyEmailVerificationCode(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'code' => 'required|digits:6',
        ]);

        $email = strtolower(trim((string) $request->email));
        $code = (string) $request->code;

        $row = PatientEmailVerification::where('email', $email)->first();
        if (!$row) {
            return response()->json(['message' => 'No verification request found for this email.'], 422);
        }
        if ($row->verified_at) {
            return response()->json(['message' => 'Email is already verified.']);
        }
        if ($row->expires_at->isPast()) {
            return response()->json(['message' => 'Verification code has expired. Please resend code.'], 422);
        }
        if ((int) $row->attempts >= 5) {
            return response()->json(['message' => 'Too many invalid attempts. Please resend code.'], 429);
        }

        if (!Hash::check($code, $row->code_hash)) {
            $row->increment('attempts');
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        $row->verified_at = now();
        $row->attempts = 0;
        $row->save();

        $verificationToken = hash('sha256', Str::uuid()->toString() . '|' . $email . '|' . now()->timestamp);
        cache()->put("patient-email-verified:{$verificationToken}", $email, now()->addMinutes(30));

        return response()->json([
            'message' => 'Email verified successfully.',
            'verification_token' => $verificationToken,
        ]);
    }

    // ── GET /api/patient/profile ──────────────────────────────
    public function profile(Request $request)
    {
        $patient = $request->user();
        $data = $patient->toArray();
        $data['public_id'] = $patient->public_id ?: $patient->buildPublicId();
        return response()->json($data);
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
                    $age = Carbon::parse($value)->age;
                    if ($age < 18) {
                        $fail('Patient must be at least 18 years old.');
                    } elseif ($age > 100) {
                        $fail('Patient age cannot be more than 100 years old.');
                    }
                },
            ],
            'gender'                 => 'sometimes|string',
            'civil_status'           => 'nullable|string',
            'nationality'            => 'nullable|string',
            'mobile'                 => ['sometimes', 'string', 'regex:/^\+63\d{10}$/'],
            'street'                 => 'sometimes|string',
            'city'                   => ['sometimes', 'string', 'regex:/^[A-Za-z\s]+$/'],
            'province'               => ['sometimes', 'string', 'regex:/^[A-Za-z\s]+$/'],
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
            'city.regex' => 'City must contain letters and spaces only.',
            'province.regex' => 'Province must contain letters and spaces only.',
        ]);

        // Never allow email or password update through this endpoint
        $patient->update($request->except(['email', 'password', 'agree_privacy', 'agree_storage']));

        $fresh = $patient->fresh();
        $data = $fresh->toArray();
        $data['public_id'] = $fresh->public_id ?: $fresh->buildPublicId();
        return response()->json($data);
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

    // ── GET /api/patients/medical-history ──────────────────────
    // Limited medical history feed for manager/staff views.
    // Returns only: patient_id, visit_date, doctor_name.
    public function medicalHistoryIndex()
    {
        $rows = queue_entries::with('doctor')
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->orderByDesc('completed_at')
            ->get()
            ->map(function (queue_entries $entry) {
                $doctorName = $entry->doctor
                    ? trim(($entry->doctor->first_name ?? '') . ' ' . ($entry->doctor->last_name ?? ''))
                    : null;

                return [
                    'patient_id' => $entry->patient_id,
                    'visit_date' => $entry->completed_at?->toISOString()
                        ?? ($entry->queue_date?->format('Y-m-d') ?: null),
                    'doctor_name' => $doctorName ?: 'Unassigned',
                ];
            })
            ->values();

        return response()->json($rows);
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
                    $age = Carbon::parse($value)->age;
                    if ($age < 18) {
                        $fail('You must be at least 18 years old to register.');
                    } elseif ($age > 100) {
                        $fail('Age cannot be more than 100 years old.');
                    }
                },
            ],
            'age'                    => 'required|integer|min:18|max:100',
            'gender'                 => 'required|string',
            'civil_status'           => 'nullable|string',
            'nationality'            => 'nullable|string',
            'mobile'                 => ['required', 'string', 'regex:/^\+63\d{10}$/'],
            'email'                  => 'required|string|email|unique:patients,email',
            'street'                 => 'required|string',
            'city'                   => ['required', 'string', 'regex:/^[A-Za-z\s]+$/'],
            'province'               => ['required', 'string', 'regex:/^[A-Za-z\s]+$/'],
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
            'email_verification_token' => 'required|string',
        ], [
            'first_name.regex' => 'Numbers are not allowed in first name.',
            'middle_name.regex' => 'Numbers are not allowed in middle name.',
            'last_name.regex' => 'Numbers are not allowed in last name.',
            'emergency_name.regex' => 'Numbers are not allowed in emergency contact name.',
            'mobile.regex' => 'Mobile number must be in +63 format followed by 10 digits.',
            'emergency_contact.regex' => 'Emergency contact number must be in +63 format followed by 10 digits.',
            'city.regex' => 'City must contain letters and spaces only.',
            'province.regex' => 'Province must contain letters and spaces only.',
            'email_verification_token.required' => 'Email verification is required.',
        ]);

        $email = strtolower(trim((string) $request->email));
        $cachedEmail = cache()->get("patient-email-verified:{$request->email_verification_token}");
        if (!$cachedEmail || strtolower((string) $cachedEmail) !== $email) {
            return response()->json([
                'message' => 'Email verification token is invalid or expired. Please verify your email again.',
            ], 422);
        }

        $patient = patients::create([
            'first_name'             => $request->first_name,
            'middle_name'            => $request->middle_name,
            'last_name'              => $request->last_name,
            'dob'                    => $request->dob,
            'age'                    => $request->age,
            'gender'                 => $request->gender,
            'civil_status'           => $request->civil_status,
            'nationality'            => null,
            'mobile'                 => $request->mobile,
            'email'                  => $email,
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
        cache()->forget("patient-email-verified:{$request->email_verification_token}");

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
