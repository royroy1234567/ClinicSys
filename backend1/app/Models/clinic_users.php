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
        'username', 'password', 'status', 'availability_status', 'created_at', 'public_id',
    ];

    protected $hidden = ['password'];

    protected static function booted(): void
    {
        static::created(function (self $user) {
            if ($user->public_id) return;
            $user->forceFill(['public_id' => $user->buildPublicId()])->saveQuietly();
        });
    }

    public function buildPublicId(): string
    {
        $roleKey = strtolower((string) $this->role);
        $prefix = match ($roleKey) {
            'doctor' => 'DCT',
            'staff' => 'STF',
            'manager' => 'MNG',
            'admin' => 'ADM',
            default => 'USR',
        };

        $base = $this->created_at ? \Carbon\Carbon::parse($this->created_at) : now();
        return sprintf('%s-%s-%06d', $prefix, $base->format('YmdHi'), (int) $this->user_id);
    }
}
