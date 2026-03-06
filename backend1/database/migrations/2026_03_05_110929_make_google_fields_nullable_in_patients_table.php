<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('patients', function (Blueprint $table) {
        $table->date('dob')->nullable()->change();
        $table->integer('age')->nullable()->change();
        $table->string('gender')->nullable()->change();
        $table->string('mobile')->nullable()->change();
        $table->string('street')->nullable()->change();
        $table->string('city')->nullable()->change();
        $table->string('province')->nullable()->change();
        $table->string('emergency_name')->nullable()->change();
        $table->string('emergency_relationship')->nullable()->change();
        $table->string('emergency_contact')->nullable()->change();
        $table->boolean('agree_privacy')->nullable()->change();
        $table->boolean('agree_storage')->nullable()->change();
    });
}

public function down(): void
{
    Schema::table('patients', function (Blueprint $table) {
        $table->date('dob')->nullable(false)->change();
        $table->integer('age')->nullable(false)->change();
        $table->string('gender')->nullable(false)->change();
        $table->string('mobile')->nullable(false)->change();
        $table->string('street')->nullable(false)->change();
        $table->string('city')->nullable(false)->change();
        $table->string('province')->nullable(false)->change();
        $table->string('emergency_name')->nullable(false)->change();
        $table->string('emergency_relationship')->nullable(false)->change();
        $table->string('emergency_contact')->nullable(false)->change();
        $table->boolean('agree_privacy')->nullable(false)->change();
        $table->boolean('agree_storage')->nullable(false)->change();
    });
}
};
