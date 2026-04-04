<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->unsignedTinyInteger('session_rating')->nullable()->after('follow_up_notes');
            $table->longText('session_feedback')->nullable()->after('session_rating');
            $table->timestamp('session_rated_at')->nullable()->after('session_feedback');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn(['session_rating', 'session_feedback', 'session_rated_at']);
        });
    }
};
