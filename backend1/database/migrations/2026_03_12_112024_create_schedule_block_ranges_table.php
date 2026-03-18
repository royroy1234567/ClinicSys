<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_blocked_ranges', function (Blueprint $table) {
            $table->id('range_id');
            $table->foreignId('schedule_id')->constrained('doctor_schedules', 'schedule_id')->onDelete('cascade');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_blocked_ranges');
    }
};