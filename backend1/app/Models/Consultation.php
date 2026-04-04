<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consultation extends Model
{
    protected $table = 'consultations';
    protected $primaryKey = 'consultation_id';

    protected $fillable = [
        'queue_entry_id',
        'patient_id',
        'doctor_id',
        'chief_complaint',
        'blood_pressure',
        'temperature',
        'heart_rate',
        'weight',
        'diagnosis',
        'notes',
        'treatment_items',
        'lab_requests',
        'follow_up_required',
        'follow_up_date',
        'follow_up_notes',
        'session_rating',
        'session_feedback',
        'session_rated_at',
        'status',
        'session_started_at',
        'completed_at',
        'finalized_at',
    ];

    protected $casts = [
        'treatment_items' => 'array',
        'lab_requests' => 'array',
        'follow_up_required' => 'boolean',
        'follow_up_date' => 'date:Y-m-d',
        'session_rating' => 'integer',
        'session_rated_at' => 'datetime',
        'session_started_at' => 'datetime',
        'completed_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public function queueEntry(): BelongsTo
    {
        return $this->belongsTo(queue_entries::class, 'queue_entry_id', 'queue_entry_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(patients::class, 'patient_id', 'id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(clinic_users::class, 'doctor_id', 'user_id');
    }
}
