<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class clinic_users extends Authenticatable
{
    protected $primaryKey = 'user_id';
    public $timestamps    = false;

    protected $fillable = [
        'first_name', 'last_name', 'role', 'specialization',
        'license_number', 'contact_number', 'email',
        'username', 'password', 'status', 'created_at',
    ];

    protected $hidden = ['password'];
}