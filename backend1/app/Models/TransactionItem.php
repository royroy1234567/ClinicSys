<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionItem extends Model
{
    protected $primaryKey = 'item_id';

    protected $fillable = [
        'transaction_id',
        'service_id',
        'service_name',
        'unit_price',
        'quantity',
        'subtotal',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'subtotal'   => 'float',
        'quantity'   => 'integer',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'transaction_id');
    }

    public function service()
    {
        return $this->belongsTo(Servics::class, 'service_id', 'service_id');
    }
}
