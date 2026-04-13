<?php

namespace App\Mail;

use App\Models\Consultation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConsultationFeedbackResponseMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Consultation $consultation,
        public string $responseMessage,
        public string $responderName
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Response to Your Feedback - ClinicSys',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.consultation-feedback-response',
            with: [
                'consultation' => $this->consultation,
                'responseMessage' => $this->responseMessage,
                'responderName' => $this->responderName,
                'patientName' => trim(($this->consultation->patient?->first_name ?? '') . ' ' . ($this->consultation->patient?->last_name ?? '')),
                'doctorName' => trim(($this->consultation->doctor?->first_name ?? '') . ' ' . ($this->consultation->doctor?->last_name ?? '')),
            ],
        );
    }
}
