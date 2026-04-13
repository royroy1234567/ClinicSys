<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Models\clinic_users;
use App\Models\patients;
use App\Mail\PatientEmailOtpMail;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'otp_code' => 'nullable|digits:6',
            'otp_token' => 'nullable|string',
        ]);

        $twoFactorEnabled = $this->isEmailTwoFactorEnabled();

        try {
            $clinicUser = clinic_users::where('email', $request->email)
                ->where('status', 'Active')
                ->first();

            if ($clinicUser && Hash::check($request->password, $clinicUser->password)) {
                if ($twoFactorEnabled) {
                    $otpValidation = $this->validateLoginOtp(
                        strtolower(trim((string) $request->email)),
                        $request->otp_token,
                        $request->otp_code
                    );

                    if ($otpValidation['requires_otp']) {
                        return response()->json([
                            'success' => false,
                            'requires_otp' => true,
                            'otp_token' => $otpValidation['otp_token'],
                            'message' => 'We sent a login verification code to your email.',
                        ], 202);
                    }
                }

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
                        'public_id'      => $clinicUser->public_id ?: $clinicUser->buildPublicId(),
                        'first_name'     => $clinicUser->first_name,
                        'last_name'      => $clinicUser->last_name,
                        'license_number' => $clinicUser->license_number,
                    ],
                ])->cookie('auth_token', $token, 60 * 24, '/', null, false, true, false, 'Lax');
                //                                                         ↑ false=dev only  ↑ Lax
            }

            $patient = patients::where('email', $request->email)->first();

            if ($patient && Hash::check($request->password, $patient->password)) {
                if ($twoFactorEnabled) {
                    $otpValidation = $this->validateLoginOtp(
                        strtolower(trim((string) $request->email)),
                        $request->otp_token,
                        $request->otp_code
                    );

                    if ($otpValidation['requires_otp']) {
                        return response()->json([
                            'success' => false,
                            'requires_otp' => true,
                            'otp_token' => $otpValidation['otp_token'],
                            'message' => 'We sent a login verification code to your email.',
                        ], 202);
                    }
                }

                $token = $patient->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'token'   => $token,
                    'user'    => [
                        'id'         => $patient->id,
                        'user_id'    => $patient->id,
                        'public_id'  => $patient->public_id ?: $patient->buildPublicId(),
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

    public function sendForgotPasswordOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim((string) $request->email));
        $account = $this->findAccountByEmail($email);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'No account found for this email.'], 404);
        }

        $otp = (string) random_int(100000, 999999);
        $otpToken = hash('sha256', $email . '|' . now()->timestamp . '|' . random_int(1000, 9999));
        $ttl = now()->addMinutes(5);

        Cache::put("forgot-password:otp:{$otpToken}", [
            'email' => $email,
            'account_type' => $account['type'],
            'account_id' => $account['id'],
            'code_hash' => Hash::make($otp),
            'attempts' => 0,
            'expires_at' => $ttl->timestamp,
        ], $ttl);

        Mail::to($email)->send(new PatientEmailOtpMail($otp, 'password_reset'));

        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your email.',
            'otp_token' => $otpToken,
            'expires_in_seconds' => 300,
        ]);
    }

    public function verifyForgotPasswordOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp_token' => 'required|string',
            'code' => 'required|digits:6',
        ]);

        $email = strtolower(trim((string) $request->email));
        $otpToken = (string) $request->otp_token;
        $code = (string) $request->code;
        $cacheKey = "forgot-password:otp:{$otpToken}";
        $state = Cache::get($cacheKey);

        if (!$state || ($state['email'] ?? null) !== $email) {
            return response()->json(['success' => false, 'message' => 'OTP request not found. Please resend OTP.'], 422);
        }

        if (($state['expires_at'] ?? 0) < now()->timestamp) {
            Cache::forget($cacheKey);
            return response()->json(['success' => false, 'message' => 'OTP expired. Please resend OTP.'], 422);
        }

        if ((int) ($state['attempts'] ?? 0) >= 5) {
            Cache::forget($cacheKey);
            return response()->json(['success' => false, 'message' => 'Too many invalid attempts. Please resend OTP.'], 429);
        }

        if (!Hash::check($code, (string) ($state['code_hash'] ?? ''))) {
            $state['attempts'] = (int) ($state['attempts'] ?? 0) + 1;
            Cache::put($cacheKey, $state, now()->addMinutes(5));
            return response()->json(['success' => false, 'message' => 'Invalid OTP code.'], 422);
        }

        Cache::forget($cacheKey);
        $resetToken = hash('sha256', $email . '|reset|' . now()->timestamp . '|' . random_int(1000, 9999));
        Cache::put("forgot-password:reset:{$resetToken}", [
            'email' => $email,
            'account_type' => $state['account_type'] ?? null,
            'account_id' => $state['account_id'] ?? null,
        ], now()->addMinutes(15));

        return response()->json([
            'success' => true,
            'message' => 'OTP verified.',
            'reset_token' => $resetToken,
        ]);
    }

    public function resetForgotPassword(Request $request)
    {
        $request->validate([
            'reset_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $token = (string) $request->reset_token;
        $state = Cache::get("forgot-password:reset:{$token}");
        if (!$state) {
            return response()->json(['success' => false, 'message' => 'Reset session expired. Please try again.'], 422);
        }

        $updated = false;
        if (($state['account_type'] ?? null) === 'clinic_user') {
            $user = clinic_users::where('user_id', $state['account_id'] ?? null)->first();
            if (!$user && !empty($state['email'])) {
                $user = clinic_users::where('email', $state['email'])->first();
            }
            if ($user) {
                $user->password = Hash::make((string) $request->password);
                $user->save();
                $updated = true;
            }
        } else {
            $patient = patients::where('id', $state['account_id'] ?? null)->first();
            if (!$patient && !empty($state['email'])) {
                $patient = patients::where('email', $state['email'])->first();
            }
            if ($patient) {
                $patient->password = Hash::make((string) $request->password);
                $patient->save();
                $updated = true;
            }
        }

        if (!$updated) {
            return response()->json(['success' => false, 'message' => 'Account not found. Please restart the flow.'], 422);
        }

        Cache::forget("forgot-password:reset:{$token}");

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful. You can now sign in.',
        ]);
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
                'public_id'      => isset($user->user_id)
                    ? ($user->public_id ?: $user->buildPublicId())
                    : ($user->public_id ?: $user->buildPublicId()),
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

    private function isEmailTwoFactorEnabled(): bool
    {
        $flag = DB::table('clinic_settings')->where('key', 'security_two_factor')->value('value');
        $channel = DB::table('clinic_settings')->where('key', 'security_two_factor_channel')->value('value');
        $enabled = in_array(strtolower((string) $flag), ['1', 'true', 'yes', 'on'], true);
        return $enabled && strtolower((string) $channel) === 'email';
    }

    private function validateLoginOtp(string $email, ?string $otpToken, ?string $otpCode): array
    {
        if (!$otpToken || !$otpCode) {
            return [
                'requires_otp' => true,
                'otp_token' => $this->issueLoginOtp($email),
            ];
        }

        $cacheKey = "login-otp:{$otpToken}";
        $state = Cache::get($cacheKey);
        if (!$state || ($state['email'] ?? null) !== $email) {
            return [
                'requires_otp' => true,
                'otp_token' => $this->issueLoginOtp($email),
            ];
        }

        if (($state['expires_at'] ?? 0) < now()->timestamp) {
            Cache::forget($cacheKey);
            return [
                'requires_otp' => true,
                'otp_token' => $this->issueLoginOtp($email),
            ];
        }

        if ((int) ($state['attempts'] ?? 0) >= 5) {
            Cache::forget($cacheKey);
            return [
                'requires_otp' => true,
                'otp_token' => $this->issueLoginOtp($email),
            ];
        }

        if (!Hash::check((string) $otpCode, (string) ($state['code_hash'] ?? ''))) {
            $state['attempts'] = (int) ($state['attempts'] ?? 0) + 1;
            Cache::put($cacheKey, $state, now()->addMinutes(10));
            return [
                'requires_otp' => true,
                'otp_token' => $otpToken,
            ];
        }

        Cache::forget($cacheKey);
        return ['requires_otp' => false, 'otp_token' => $otpToken];
    }

    private function issueLoginOtp(string $email): string
    {
        $code = (string) random_int(100000, 999999);
        $token = hash('sha256', $email . '|' . now()->timestamp . '|' . random_int(1000, 9999));
        Cache::put("login-otp:{$token}", [
            'email' => $email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10)->timestamp,
        ], now()->addMinutes(10));

        Mail::to($email)->send(new PatientEmailOtpMail($code, '2fa'));
        return $token;
    }

    private function findAccountByEmail(string $email): ?array
    {
        $clinicUser = clinic_users::where('email', $email)->first();
        if ($clinicUser) {
            return [
                'type' => 'clinic_user',
                'id' => $clinicUser->user_id,
            ];
        }

        $patient = patients::where('email', $email)->first();
        if ($patient) {
            return [
                'type' => 'patient',
                'id' => $patient->id,
            ];
        }

        return null;
    }
}
