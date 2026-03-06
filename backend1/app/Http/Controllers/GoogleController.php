<?php

namespace App\Http\Controllers;

use App\Models\patients;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->stateless()
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect('http://localhost:5173/register?error=google_failed');
        }

        // Check if patient already exists
        $existing = patients::where('email', $googleUser->getEmail())->first();

        if ($existing) {
            // Already registered — send back to register with email_taken error
            return redirect('http://localhost:5173/register?error=email_taken&email=' . urlencode($googleUser->getEmail()));
        }

        // New user — only pass email to frontend
        return redirect('http://localhost:5173/register?google=' . urlencode(json_encode([
            'email' => $googleUser->getEmail(),
        ])));
    }
}