<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PatientEmailOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $otpCode, public string $purpose = 'verify')
    {
    }

    public function envelope(): Envelope
    {
        $subject = match ($this->purpose) {
            '2fa' => 'Your ClinicSys Login Security Code',
            'password_reset' => 'Your ClinicSys Password Reset Code',
            default => 'Your ClinicSys Verification Code',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.patient-email-otp',
            with: [
                'otpCode' => $this->otpCode,
                'purpose' => $this->purpose,
            ],
        );
    }
}

