<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminSystemController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        $role = strtolower((string) ($request->user()->role ?? ''));
        abort_unless($role === 'admin', 403, 'Forbidden.');
    }

    public function backupNow(Request $request)
    {
        $this->ensureAdmin($request);

        $timestamp = now()->format('Ymd-His');
        $fileName = "clinicsys-backup-{$timestamp}.json";
        $path = "backups/{$fileName}";

        $appointments = DB::table('appointments')->get();
        $walkins = DB::table('queue_entries')->whereIn('source', ['walkin', 'walk-in'])->get();
        $services = DB::table('services')->get();
        $clinicUsers = DB::table('clinic_users')->get();
        $consultations = DB::table('consultations')->get();
        $doctorSchedules = DB::table('doctor_schedules')->get();
        $scheduleSlots = DB::table('schedule_slots')->get();
        $hasBlockedRangesTable = DB::getSchemaBuilder()->hasTable('schedule_blocked_ranges');
        $blockedRanges = $hasBlockedRangesTable
            ? DB::table('schedule_blocked_ranges')->get()
            : collect();
        $transactions = DB::table('transactions')->get();
        $transactionItems = DB::table('transaction_items')->get();
        $clinicSettings = DB::table('clinic_settings')->get();

        $payload = [
            'generated_at' => now()->toISOString(),
            'scope' => 'system-only',
            'excluded' => [
                'patients',
                'patient_email_verifications',
            ],
            'meta' => [
                'appointments_count' => $appointments->count(),
                'walkins_count' => $walkins->count(),
                'services_count' => $services->count(),
                'clinic_users_count' => $clinicUsers->count(),
                'consultations_count' => $consultations->count(),
                'doctor_schedules_count' => $doctorSchedules->count(),
                'schedule_slots_count' => $scheduleSlots->count(),
                'blocked_ranges_count' => $blockedRanges->count(),
                'blocked_ranges_table_exists' => $hasBlockedRangesTable,
                'transactions_count' => $transactions->count(),
                'transaction_items_count' => $transactionItems->count(),
            ],
            'data' => [
                'appointments' => $appointments,
                'walkins' => $walkins,
                'services' => $services,
                'clinic_users' => $clinicUsers,
                'consultations' => $consultations,
                'doctor_schedules' => $doctorSchedules,
                'schedule_slots' => $scheduleSlots,
                'schedule_blocked_ranges' => $blockedRanges,
                'transactions' => $transactions,
                'transaction_items' => $transactionItems,
                'clinic_settings' => $clinicSettings,
            ],
        ];

        Storage::disk('local')->put($path, json_encode($payload, JSON_PRETTY_PRINT));

        DB::table('clinic_settings')->updateOrInsert(
            ['key' => 'system_last_backup_at'],
            ['value' => now()->toISOString(), 'updated_at' => now()]
        );
        DB::table('clinic_settings')->updateOrInsert(
            ['key' => 'system_last_backup_file'],
            ['value' => $path, 'updated_at' => now()]
        );

        return response()->json([
            'success' => true,
            'file_name' => $fileName,
            'path' => $path,
            'message' => 'Backup created successfully.',
        ]);
    }

    public function downloadLastBackup(Request $request)
    {
        $this->ensureAdmin($request);

        $path = DB::table('clinic_settings')->where('key', 'system_last_backup_file')->value('value');
        if (!$path || !Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'No backup file available.'], 404);
        }

        return Storage::disk('local')->download($path, basename($path), [
            'Content-Type' => 'application/json',
        ]);
    }

    public function clearActivityLogs(Request $request)
    {
        $this->ensureAdmin($request);

        DB::table('clinic_settings')->updateOrInsert(
            ['key' => 'system_logs_cleared_at'],
            ['value' => now()->toISOString(), 'updated_at' => now()]
        );

        return response()->json([
            'success' => true,
            'cleared_at' => now()->toISOString(),
            'message' => 'Activity logs cleared.',
        ]);
    }
}

