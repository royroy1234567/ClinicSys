<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->string('public_id')->nullable()->unique()->after('user_id');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->string('public_id')->nullable()->unique()->after('id');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('appointment_number')->nullable()->unique()->after('appointment_id');
        });

        Schema::table('consultations', function (Blueprint $table) {
            $table->string('consultation_number')->nullable()->unique()->after('consultation_id');
        });

        Schema::table('queue_entries', function (Blueprint $table) {
            $table->string('queue_reference_number')->nullable()->unique()->after('queue_entry_id');
        });

        $clinicUsers = DB::table('clinic_users')->select('user_id', 'role', 'created_at')->get();
        foreach ($clinicUsers as $u) {
            $prefix = match (strtolower((string) $u->role)) {
                'doctor' => 'DCT',
                'staff' => 'STF',
                'manager' => 'MNG',
                'admin' => 'ADM',
                default => 'USR',
            };
            $stamp = \Carbon\Carbon::parse($u->created_at ?? now())->format('YmdHi');
            DB::table('clinic_users')->where('user_id', $u->user_id)->update([
                'public_id' => sprintf('%s-%s-%06d', $prefix, $stamp, (int) $u->user_id),
            ]);
        }

        $patients = DB::table('patients')->select('id', 'created_at')->get();
        foreach ($patients as $p) {
            $stamp = \Carbon\Carbon::parse($p->created_at ?? now())->format('YmdHi');
            DB::table('patients')->where('id', $p->id)->update([
                'public_id' => sprintf('PAT-%s-%06d', $stamp, (int) $p->id),
            ]);
        }

        $appointments = DB::table('appointments')->select('appointment_id', 'appointment_date', 'appointment_time')->get();
        foreach ($appointments as $a) {
            $datePart = preg_replace('/[^0-9]/', '', (string) $a->appointment_date) ?: now()->format('Ymd');
            $timePart = substr(str_pad(preg_replace('/[^0-9]/', '', (string) $a->appointment_time), 4, '0'), 0, 4) ?: '0000';
            DB::table('appointments')->where('appointment_id', $a->appointment_id)->update([
                'appointment_number' => sprintf('APT-%s%s-%06d', $datePart, $timePart, (int) $a->appointment_id),
            ]);
        }

        $consultations = DB::table('consultations')->select('consultation_id', 'finalized_at', 'completed_at', 'updated_at', 'created_at')->get();
        foreach ($consultations as $c) {
            $base = $c->finalized_at ?? $c->completed_at ?? $c->updated_at ?? $c->created_at ?? now();
            $stamp = \Carbon\Carbon::parse($base)->format('YmdHi');
            DB::table('consultations')->where('consultation_id', $c->consultation_id)->update([
                'consultation_number' => sprintf('CON-%s-%06d', $stamp, (int) $c->consultation_id),
            ]);
        }

        $queues = DB::table('queue_entries')->select('queue_entry_id', 'queue_date', 'arrival_time', 'queue_number')->get();
        foreach ($queues as $q) {
            $datePart = preg_replace('/[^0-9]/', '', (string) $q->queue_date) ?: now()->format('Ymd');
            $timePart = $q->arrival_time ? str_replace(':', '', substr((string) $q->arrival_time, 0, 5)) : '0000';
            $seq = str_pad((string) ((int) ($q->queue_number ?? 0)), 4, '0', STR_PAD_LEFT);
            DB::table('queue_entries')->where('queue_entry_id', $q->queue_entry_id)->update([
                'queue_reference_number' => sprintf('QUE-%s%s-%s', $datePart, $timePart, $seq),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('queue_entries', function (Blueprint $table) {
            $table->dropColumn('queue_reference_number');
        });
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn('consultation_number');
        });
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('appointment_number');
        });
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('public_id');
        });
        Schema::table('clinic_users', function (Blueprint $table) {
            $table->dropColumn('public_id');
        });
    }
};
