<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servics extends Model
{
    protected $table = 'services';  // ← add this line
    protected $primaryKey = 'service_id';

    protected $fillable = [
        'service_name',
        'description',
        'price',
        'duration_minutes',
        'unit',
        'category',
        'status',
    ];

    protected $casts = [
        'price'            => 'float',
        'duration_minutes' => 'integer',
    ];
}