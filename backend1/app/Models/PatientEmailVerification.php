<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientEmailVerification extends Model
{
    protected $fillable = [
        'email',
        'code_hash',
        'expires_at',
        'attempts',
        'verified_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];
}

