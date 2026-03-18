<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorSchedule extends Model
{
    protected $primaryKey = 'schedule_id';

    protected $fillable = [
        'user_id',
        'schedule_date',
        'repeat',
        'repeat_weeks',
    ];

    protected $casts = [
        'schedule_date' => 'date:Y-m-d',
        'repeat'        => 'boolean',
        'repeat_weeks'  => 'integer',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(clinic_users::class, 'user_id', 'user_id');
    }

    public function slots(): HasMany
    {
        return $this->hasMany(ScheduleSlot::class, 'schedule_id', 'schedule_id');
    }
}