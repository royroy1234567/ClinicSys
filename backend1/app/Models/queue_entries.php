<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Servics;

class queue_entries extends Model
{
    protected $table = 'queue_entries';
    protected $primaryKey = 'queue_entry_id';

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'doctor_id',
        'service_id',
        'queue_reference_number',
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

    public function service(): BelongsTo
    {
        return $this->belongsTo(Servics::class, 'service_id', 'service_id');
    }

    protected static function booted(): void
    {
        static::created(function (self $entry) {
            if ($entry->queue_reference_number) return;
            $entry->forceFill(['queue_reference_number' => $entry->buildQueueReferenceNumber()])->saveQuietly();
        });
    }

    public function buildQueueReferenceNumber(): string
    {
        $baseDate = $this->queue_date ? \Carbon\Carbon::parse($this->queue_date) : now();
        $timePart = $this->arrival_time ? str_replace(':', '', substr((string) $this->arrival_time, 0, 5)) : '0000';
        $dailySeq = str_pad((string) ($this->queue_number ?? 0), 4, '0', STR_PAD_LEFT);
        return sprintf('QUE-%s%s-%s', $baseDate->format('Ymd'), $timePart, $dailySeq);
    }
}
