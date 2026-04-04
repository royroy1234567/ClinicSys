<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $primaryKey = 'transaction_id';

    protected $fillable = [
        'transaction_number',
        'patient_id',
        'queue_entry_id',
        'staff_id',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'amount_tendered',
        'change_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'subtotal'        => 'float',
        'discount'        => 'float',
        'total'           => 'float',
        'amount_tendered' => 'float',
        'change_amount'   => 'float',
    ];

    public function patient()
    {
        return $this->belongsTo(patients::class, 'patient_id', 'id');
    }

    public function staff()
    {
        return $this->belongsTo(clinic_users::class, 'staff_id', 'user_id');
    }

    public function queueEntry()
    {
        return $this->belongsTo(queue_entries::class, 'queue_entry_id', 'queue_entry_id');
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class, 'transaction_id', 'transaction_id');
    }
}
