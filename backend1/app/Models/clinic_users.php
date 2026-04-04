<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class clinic_users extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $primaryKey = 'user_id';
    public $timestamps    = false;

    protected $fillable = [
        'first_name', 'last_name', 'role', 'specialization',
        'license_number', 'contact_number', 'email',
        'username', 'password', 'status', 'availability_status', 'created_at',
    ];

    protected $hidden = ['password'];
}
