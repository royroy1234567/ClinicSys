<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    protected $primaryKey = 'appointment_id';

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'service_id',
        'appointment_date',
        'appointment_time',
        'appointment_number',
        'reason',
        'notes',
        'status',
        'cancellation_reason',
        'reschedule_reason',
    ];

    protected $casts = [
        'appointment_date' => 'date:Y-m-d',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(patients::class, 'patient_id', 'id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(clinic_users::class, 'doctor_id', 'user_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Servics::class, 'service_id', 'service_id');
    }

    protected static function booted(): void
    {
        static::created(function (self $appointment) {
            if ($appointment->appointment_number) return;
            $appointment->forceFill(['appointment_number' => $appointment->buildAppointmentNumber()])->saveQuietly();
        });
    }

    public function buildAppointmentNumber(): string
    {
        $datePart = $this->appointment_date instanceof \Carbon\Carbon
            ? $this->appointment_date->format('Ymd')
            : preg_replace('/[^0-9]/', '', (string) $this->appointment_date);

        $timePart = preg_replace('/[^0-9]/', '', (string) $this->appointment_time);
        $timePart = substr(str_pad($timePart, 4, '0'), 0, 4);

        return sprintf('APT-%s%s-%06d', $datePart ?: now()->format('Ymd'), $timePart ?: '0000', (int) $this->appointment_id);
    }
}
