<?php

namespace App\Mail;

use App\Models\Consultation;
use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConsultationCompletedPatientMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Consultation $consultation,
        public ?Transaction $transaction = null
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Consultation Completed - ClinicSys',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.consultation-completed',
            with: [
                'consultation' => $this->consultation,
                'transaction' => $this->transaction,
                'patientName' => trim(($this->consultation->patient?->first_name ?? '') . ' ' . ($this->consultation->patient?->last_name ?? '')),
                'doctorName' => trim(($this->consultation->doctor?->first_name ?? '') . ' ' . ($this->consultation->doctor?->last_name ?? '')),
            ],
        );
    }
}

