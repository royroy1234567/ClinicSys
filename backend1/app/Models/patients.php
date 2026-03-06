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

    /**
     * Full name accessor
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}