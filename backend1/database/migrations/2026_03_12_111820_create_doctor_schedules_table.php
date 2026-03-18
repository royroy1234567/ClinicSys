<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id('schedule_id');
            $table->foreignId('user_id')->constrained('clinic_users', 'user_id')->onDelete('cascade');
            $table->date('schedule_date');
            $table->boolean('blocked')->default(false);
            $table->boolean('block_full')->default(false);
            $table->string('block_reason')->nullable();
            $table->boolean('repeat')->default(false);
            $table->integer('repeat_weeks')->default(4);
            $table->timestamps();

            $table->unique(['user_id', 'schedule_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_schedules');
    }
};