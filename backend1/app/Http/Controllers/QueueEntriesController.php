<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\queue_entries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QueueEntriesController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $existingAppointmentIds = queue_entries::where('queue_date', $date)
            ->whereNotNull('appointment_id')
            ->pluck('appointment_id');

        $appointmentsToQueue = Appointment::with('patient')
            ->whereDate('appointment_date', $date)
            ->where('status', 'scheduled')
            ->whereNotIn('appointment_id', $existingAppointmentIds)
            ->orderBy('appointment_time')
            ->get();

        if ($appointmentsToQueue->isNotEmpty()) {
            DB::transaction(function () use ($date, $appointmentsToQueue) {
                $next = (int) queue_entries::where('queue_date', $date)
                    ->lockForUpdate()
                    ->max('queue_number') + 1;

                foreach ($appointmentsToQueue as $appointment) {
                    $isSenior = (int) ($appointment->patient->age ?? 0) >= 60;
                    queue_entries::create([
                        'appointment_id' => $appointment->appointment_id,
                        'patient_id' => $appointment->patient_id,
                        'doctor_id' => $appointment->doctor_id,
                        'queue_date' => $date,
                        'queue_number' => $next++,
                        'source' => 'appointment',
                        'priority' => $isSenior ? 'senior' : 'appointment',
                        'status' => 'waiting',
                        'arrival_time' => $appointment->appointment_time,
                    ]);
                }
            });
        }

        $rows = queue_entries::with(['patient', 'doctor', 'appointment'])
            ->where('queue_date', $date)
            ->orderBy('queue_number')
            ->get()
            ->map(function (queue_entries $q) {
                return [
                    'queue_entry_id' => $q->queue_entry_id,
                    'queue_number' => $q->queue_number,
                    'patient_id' => $q->patient_id,
                    'patient_name' => trim(($q->patient->first_name ?? '') . ' ' . ($q->patient->last_name ?? '')),
                    'doctor_id' => $q->doctor_id,
                    'doctor_name' => $q->doctor ? trim(($q->doctor->first_name ?? '') . ' ' . ($q->doctor->last_name ?? '')) : null,
                    'priority' => $q->priority,
                    'status' => str_replace('-', '_', $q->status),
                    'source' => str_replace('-', '', $q->source),
                    'arrival_time' => $q->arrival_time ? substr((string) $q->arrival_time, 0, 5) : null,
                    'appointment_id' => $q->appointment_id,
                    'reason' => $q->appointment?->reason,
                ];
            });

        return response()->json($rows);
    }

    public function storeWalkin(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|integer|exists:patients,id',
            'doctor_id' => 'nullable|integer|exists:clinic_users,user_id',
            'priority' => 'required|in:senior,walkin',
        ]);

        $created = DB::transaction(function () use ($request) {
            $date = now()->toDateString();
            $next = (int) queue_entries::where('queue_date', $date)->max('queue_number') + 1;

            return queue_entries::create([
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'queue_date' => $date,
                'queue_number' => $next,
                'source' => 'walk-in',
                'priority' => $request->priority,
                'status' => 'waiting',
                'arrival_time' => now()->format('H:i:s'),
            ]);
        });

        $created->load(['patient', 'doctor']);

        return response()->json([
            'queue_entry_id' => $created->queue_entry_id,
            'queue_number' => $created->queue_number,
            'patient_id' => $created->patient_id,
            'patient_name' => trim(($created->patient->first_name ?? '') . ' ' . ($created->patient->last_name ?? '')),
            'doctor_id' => $created->doctor_id,
            'doctor_name' => $created->doctor ? trim(($created->doctor->first_name ?? '') . ' ' . ($created->doctor->last_name ?? '')) : null,
            'priority' => $created->priority,
            'status' => str_replace('-', '_', $created->status),
            'source' => 'walkin',
            'arrival_time' => $created->arrival_time ? substr((string) $created->arrival_time, 0, 5) : null,
            'appointment_id' => $created->appointment_id,
            'reason' => null,
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:waiting,called,ongoing,completed,no_show',
        ]);

        $entry = queue_entries::findOrFail($id);
        $status = str_replace('_', '-', $request->status);
        $now = now();

        $updates = ['status' => $status];
        if ($status === 'called') {
            $updates['called_at'] = $now;
        } elseif ($status === 'ongoing') {
            $updates['started_at'] = $now;
        } elseif (in_array($status, ['completed', 'no-show'], true)) {
            $updates['completed_at'] = $now;
        }

        $entry->update($updates);

        return response()->json([
            'message' => 'Queue status updated.',
            'queue_entry_id' => $entry->queue_entry_id,
            'status' => str_replace('-', '_', $entry->status),
        ]);
    }

    public function checkInAppointment($id)
    {
        $appointment = Appointment::findOrFail($id);
        $date = $appointment->appointment_date instanceof \Carbon\Carbon
            ? $appointment->appointment_date->format('Y-m-d')
            : (string) $appointment->appointment_date;

        $existing = queue_entries::where('appointment_id', $appointment->appointment_id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Appointment already checked in.',
                'queue_entry_id' => $existing->queue_entry_id,
            ], 409);
        }

        $created = DB::transaction(function () use ($appointment, $date) {
            $next = (int) queue_entries::where('queue_date', $date)->max('queue_number') + 1;

            return queue_entries::create([
                'appointment_id' => $appointment->appointment_id,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'queue_date' => $date,
                'queue_number' => $next,
                'source' => 'appointment',
                'priority' => 'appointment',
                'status' => 'waiting',
                'arrival_time' => now()->format('H:i:s'),
            ]);
        });

        return response()->json([
            'message' => 'Appointment checked in.',
            'queue_entry_id' => $created->queue_entry_id,
        ], 201);
    }
}
