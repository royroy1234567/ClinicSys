<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->string('availability_status', 20)->default('unavailable')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->dropColumn('availability_status');
        });
    }
};
