<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleBlockedRange extends Model
{
    protected $primaryKey = 'range_id';

    protected $fillable = [
        'schedule_id',
        'start_time',
        'end_time',
        'reason',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(DoctorSchedule::class, 'schedule_id', 'schedule_id');
    }
}