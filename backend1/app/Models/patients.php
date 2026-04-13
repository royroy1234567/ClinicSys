<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class patients extends Authenticatable
{
    use HasApiTokens, HasFactory;

protected $fillable = [
    // Personal
    'first_name', 'middle_name', 'last_name',
    'dob', 'age', 'gender', 'civil_status', 'nationality',

    // Contact
    'mobile', 'street', 'city', 'province',

    // Account
    'email', 'password', 'google_id', // ✅ added google_id

    // Medical
    'blood_type', 'allergies', 'conditions', 'medications',

    // Emergency
    'emergency_name', 'emergency_relationship', 'emergency_contact',

    // Consent
    'agree_privacy', 'agree_storage',
    'public_id',
];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'dob'           => 'date',
        'agree_privacy' => 'boolean',
        'agree_storage' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::created(function (self $patient) {
            if ($patient->public_id) return;
            $patient->forceFill(['public_id' => $patient->buildPublicId()])->saveQuietly();
        });
    }

    public function buildPublicId(): string
    {
        $base = $this->created_at ? \Carbon\Carbon::parse($this->created_at) : now();
        return sprintf('PAT-%s-%06d', $base->format('YmdHi'), (int) $this->id);
    }

    /**
     * Full name accessor
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}
