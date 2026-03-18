<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleSlot extends Model
{
    protected $primaryKey = 'slot_id';

    protected $fillable = [
        'schedule_id',
        'start_time',
        'end_time',
        'duration',
        'max_patients',
        'booked',
    ];

    protected $casts = [
        'duration'     => 'integer',
        'max_patients' => 'integer',
        'booked'       => 'integer',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(DoctorSchedule::class, 'schedule_id', 'schedule_id');
    }
}