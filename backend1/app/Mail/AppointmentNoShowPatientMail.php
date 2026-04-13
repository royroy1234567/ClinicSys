<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentNoShowPatientMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Appointment $appointment)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Missed Appointment Notice - ClinicSys');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-no-show',
            with: [
                'appointment' => $this->appointment,
                'patientName' => trim(($this->appointment->patient?->first_name ?? '') . ' ' . ($this->appointment->patient?->last_name ?? '')),
                'doctorName' => trim(($this->appointment->doctor?->first_name ?? '') . ' ' . ($this->appointment->doctor?->last_name ?? '')),
            ]
        );
    }
}

