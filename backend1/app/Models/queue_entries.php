<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class queue_entries extends Model
{
    protected $table = 'queue_entries';
    protected $primaryKey = 'queue_entry_id';

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'doctor_id',
        'queue_date',
        'queue_number',
        'source',
        'priority',
        'status',
        'arrival_time',
        'called_at',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'queue_date' => 'date:Y-m-d',
        'called_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(patients::class, 'patient_id', 'id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(clinic_users::class, 'doctor_id', 'user_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }
}
