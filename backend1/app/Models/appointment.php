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
        'reason',
        'notes',
        'status',
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
}