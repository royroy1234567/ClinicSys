<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\clinic_users;
use App\Models\patients;
use App\Models\queue_entries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Mail\AppointmentNoShowPatientMail;
use App\Mail\AppointmentCompletedPatientMail;

class QueueEntriesController extends Controller
{
    private const ACTIVE_QUEUE_STATUSES = ['waiting', 'called', 'ongoing'];
    private const PH_TIMEZONE = 'Asia/Manila';

    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        $this->expireCalledEntries($date);

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
                    $alreadyActive = queue_entries::where('queue_date', $date)
                        ->where('patient_id', $appointment->patient_id)
                        ->whereIn('status', self::ACTIVE_QUEUE_STATUSES)
                        ->exists();

                    if ($alreadyActive) {
                        continue;
                    }

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
                        // Appointment queue arrival follows the booked appointment time.
                        'arrival_time' => $this->appointmentArrivalTime($appointment),
                    ]);
                }
            });
        }

        $rows = queue_entries::with(['patient', 'doctor', 'appointment.service', 'service'])
            ->where('queue_date', $date)
            ->orderByRaw('CASE WHEN arrival_time IS NULL THEN 1 ELSE 0 END')
            ->orderBy('arrival_time')
            ->orderBy('queue_number')
            ->get()
            ->map(fn(queue_entries $q) => $this->formatQueueEntry($q));

        return response()->json($rows);
    }

    public function storeWalkin(Request $request)
    {
        $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'name' => 'required_without:patient_id|string|max:150',
            'age' => 'nullable|integer|min:18|max:100',
            'contact' => ['nullable', 'string', 'regex:/^\+63\d{10}$/'],
            'service_id' => 'required|integer|exists:services,service_id',
            'doctor_id' => 'nullable|integer|exists:clinic_users,user_id',
            'priority' => 'required|in:senior,walkin',
        ], [
            'age.min' => 'Walk-in age must be at least 18.',
            'age.max' => 'Walk-in age cannot be more than 100.',
            'contact.regex' => 'Contact number must be in +63 format followed by 10 digits.',
        ]);

        $created = DB::transaction(function () use ($request) {
            $patientId = $request->patient_id;
            if (!$patientId) {
                $patient = $this->createWalkinPatient(
                    (string) $request->name,
                    $request->age,
                    $request->contact
                );
                $patientId = $patient->id;
            }

            $date = now()->toDateString();
            $alreadyActive = queue_entries::where('queue_date', $date)
                ->where('patient_id', $patientId)
                ->whereIn('status', self::ACTIVE_QUEUE_STATUSES)
                ->exists();

            if ($alreadyActive) {
                throw ValidationException::withMessages([
                    'patient_id' => ['Patient is already in queue (waiting/called/ongoing).'],
                ]);
            }

            $next = (int) queue_entries::where('queue_date', $date)->max('queue_number') + 1;
            $doctorId = $request->doctor_id ? (int) $request->doctor_id : null;

            if ($doctorId) {
                $doctor = clinic_users::find($doctorId);
                if (!$doctor || $doctor->role !== 'Doctor') {
                    throw ValidationException::withMessages([
                        'doctor_id' => ['Only doctors can be assigned.'],
                    ]);
                }

                if (strtolower((string) ($doctor->availability_status ?? 'unavailable')) !== 'available') {
                    throw ValidationException::withMessages([
                        'doctor_id' => ['Selected doctor is currently unavailable.'],
                    ]);
                }

                $doctorHasActivePatient = queue_entries::where('queue_date', $date)
                    ->where('doctor_id', $doctorId)
                    ->whereIn('status', ['called', 'ongoing'])
                    ->exists();

                if ($doctorHasActivePatient) {
                    throw ValidationException::withMessages([
                        'doctor_id' => ['Selected doctor already has an active patient.'],
                    ]);
                }
            }

            return queue_entries::create([
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'service_id' => $request->service_id,
                'queue_date' => $date,
                'queue_number' => $next,
                'source' => 'walk-in',
                'priority' => $request->priority,
                'status' => 'waiting',
                // Walk-in queue arrival uses real check-in time in PH timezone.
                'arrival_time' => now(self::PH_TIMEZONE)->format('H:i:s'),
            ]);
        });

        $created->load(['patient', 'doctor', 'service']);

        return response()->json($this->formatQueueEntry($created), 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:waiting,called,ongoing,completed,no_show',
        ]);

        $entry = queue_entries::findOrFail($id);
        $status = str_replace('_', '-', $request->status);
        $now = now(self::PH_TIMEZONE);

        if ($status === 'called') {
            if (!$entry->doctor_id) {
                return response()->json(['message' => 'Assign a doctor before calling this patient.'], 422);
            }

            $doctor = clinic_users::find($entry->doctor_id);
            if (!$doctor || strtolower($doctor->availability_status ?? 'unavailable') !== 'available') {
                return response()->json(['message' => 'Selected doctor is not available yet.'], 422);
            }

            if ($entry->source === 'appointment' && $entry->arrival_time) {
                $arrival = now(self::PH_TIMEZONE)->setTimeFromTimeString((string) $entry->arrival_time);
                if (now(self::PH_TIMEZONE)->lt($arrival)) {
                    return response()->json(['message' => 'Appointment patient is not yet ready to be called.'], 422);
                }
            }

            $doctorHasOngoing = queue_entries::where('doctor_id', $entry->doctor_id)
                ->where('queue_date', $entry->queue_date)
                ->where('status', 'ongoing')
                ->where('queue_entry_id', '!=', $entry->queue_entry_id)
                ->exists();
            if ($doctorHasOngoing) {
                return response()->json(['message' => 'Doctor already has an ongoing consultation.'], 422);
            }
        }

        $updates = ['status' => $status];
        if ($status === 'called') {
            $updates['called_at'] = $now;
        } elseif ($status === 'ongoing') {
            $updates['started_at'] = $now;
        } elseif (in_array($status, ['completed', 'no-show'], true)) {
            $updates['completed_at'] = $now;
        }

        $entry->update($updates);

        if ($entry->appointment_id && in_array($status, ['completed', 'no-show'], true)) {
            $appointment = Appointment::find($entry->appointment_id);
            if ($appointment) {
                $appointmentStatus = $status === 'no-show' ? 'no_show' : $status;
                if ($appointment->status !== $appointmentStatus) {
                    $appointment->status = $appointmentStatus;
                    $appointment->save();
                }

                try {
                    $appointment->load(['patient', 'doctor', 'service']);
                    if (!empty($appointment->patient?->email)) {
                        if ($status === 'completed') {
                            Mail::to($appointment->patient->email)->send(new AppointmentCompletedPatientMail($appointment));
                        }
                        if ($status === 'no-show') {
                            Mail::to($appointment->patient->email)->send(new AppointmentNoShowPatientMail($appointment));
                        }
                    }
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }

        if ($entry->doctor_id) {
            $doctor = clinic_users::find($entry->doctor_id);
            if ($doctor) {
                if ($status === 'ongoing') {
                    $doctor->availability_status = 'unavailable';
                    $doctor->save();
                }

            }
        }

        return response()->json([
            'message' => 'Queue status updated.',
            'queue_entry_id' => $entry->queue_entry_id,
            'status' => str_replace('-', '_', $entry->status),
        ]);
    }

    public function assignDoctor(Request $request, $id)
    {
        $request->validate([
            'doctor_id' => 'required|integer|exists:clinic_users,user_id',
        ]);

        $entry = queue_entries::with(['patient', 'doctor', 'appointment.service', 'service'])->findOrFail($id);
        $doctor = clinic_users::findOrFail($request->doctor_id);
        if ($doctor->role !== 'Doctor') {
            return response()->json(['message' => 'Only doctors can be assigned.'], 422);
        }

        if (strtolower((string) ($doctor->availability_status ?? 'unavailable')) !== 'available') {
            return response()->json(['message' => 'Doctor is unavailable and cannot be assigned.'], 422);
        }

        $doctorHasActivePatient = queue_entries::whereDate('queue_date', now()->toDateString())
            ->where('doctor_id', $doctor->user_id)
            ->whereIn('status', ['called', 'ongoing'])
            ->where('queue_entry_id', '!=', $entry->queue_entry_id)
            ->exists();

        if ($doctorHasActivePatient) {
            return response()->json(['message' => 'Doctor already has an active patient.'], 422);
        }

        $entry->doctor_id = $doctor->user_id;
        $entry->save();
        $entry->load(['patient', 'doctor', 'appointment.service', 'service']);

        return response()->json([
            'message' => 'Doctor assigned successfully.',
            'entry' => $this->formatQueueEntry($entry),
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

        $alreadyActive = queue_entries::where('queue_date', $date)
            ->where('patient_id', $appointment->patient_id)
            ->whereIn('status', self::ACTIVE_QUEUE_STATUSES)
            ->exists();

        if ($alreadyActive) {
            return response()->json([
                'message' => 'Patient is already in queue (waiting/called/ongoing).',
            ], 422);
        }

        $created = DB::transaction(function () use ($appointment, $date) {
            $next = (int) queue_entries::where('queue_date', $date)->max('queue_number') + 1;

            return queue_entries::create([
                'appointment_id' => $appointment->appointment_id,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'service_id' => $appointment->service_id,
                'queue_date' => $date,
                'queue_number' => $next,
                'source' => 'appointment',
                'priority' => 'appointment',
                'status' => 'waiting',
                // Appointment queue arrival follows the booked appointment time.
                'arrival_time' => $this->appointmentArrivalTime($appointment),
            ]);
        });

        return response()->json([
            'message' => 'Appointment checked in.',
            'queue_entry_id' => $created->queue_entry_id,
        ], 201);
    }

    private function createWalkinPatient(string $fullName, $age = null, $contact = null): patients
    {
        $parts = array_values(array_filter(explode(' ', trim(preg_replace('/\s+/', ' ', $fullName)))));
        $firstName = $parts[0] ?? 'Walk-in';
        $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : 'Patient';
        $safeBase = Str::slug($fullName ?: 'walkin', '.');
        $email = sprintf('%s.%s@walkin.local', $safeBase ?: 'walkin', Str::lower(Str::random(6)));

        return patients::create([
            'first_name' => Str::title($firstName),
            'middle_name' => null,
            'last_name' => Str::title($lastName),
            'dob' => now()->subYears((int) ($age ?? 30))->toDateString(),
            'age' => (int) ($age ?? 30),
            'gender' => 'Unspecified',
            'civil_status' => null,
            'nationality' => null,
            'mobile' => $contact ?: '+639000000000',
            'email' => $email,
            'street' => 'Walk-in',
            'city' => 'Walk-in',
            'province' => 'Walk-in',
            'password' => Hash::make(Str::random(20)),
            'blood_type' => null,
            'allergies' => null,
            'conditions' => null,
            'medications' => null,
            'emergency_name' => 'Walk-in Contact',
            'emergency_relationship' => 'N/A',
            'emergency_contact' => $contact ?: '+639000000000',
            'agree_privacy' => true,
            'agree_storage' => true,
            'status' => 'Active',
        ]);
    }

    private function formatQueueEntry(queue_entries $q): array
    {
        $service = $q->appointment?->service ?? $q->service;
        return [
            'queue_entry_id' => $q->queue_entry_id,
            'queue_reference_number' => $q->queue_reference_number ?: $q->buildQueueReferenceNumber(),
            'queue_number' => $q->queue_number,
            'patient_id' => $q->patient_id,
            'patient_name' => trim(($q->patient->first_name ?? '') . ' ' . ($q->patient->last_name ?? '')),
            'patient_age' => $q->patient->age ?? null,
            'patient_contact' => $q->patient->mobile ?? null,
            'doctor_id' => $q->doctor_id,
            'doctor_name' => $q->doctor ? trim(($q->doctor->first_name ?? '') . ' ' . ($q->doctor->last_name ?? '')) : null,
            'doctor_availability' => $q->doctor ? strtolower($q->doctor->availability_status ?: 'unavailable') : null,
            'priority' => $q->priority,
            'status' => str_replace('-', '_', $q->status),
            'source' => str_replace('-', '', $q->source),
            'arrival_time' => $q->arrival_time ? substr((string) $q->arrival_time, 0, 5) : null,
            'called_at' => $q->called_at?->toISOString(),
            'called_deadline_at' => ($q->status === 'called' && $q->called_at && !$q->started_at)
                ? $q->called_at->copy()->addMinutes(5)->toISOString()
                : null,
            'started_at' => $q->started_at?->toISOString(),
            'appointment_id' => $q->appointment_id,
            'reason' => $q->appointment?->reason,
            'service_id' => $service?->service_id,
            'service_name' => $service?->service_name,
            'service_price' => $service ? (float) $service->price : null,
        ];
    }

    private function expireCalledEntries(string $date): void
    {
        $cutoff = now(self::PH_TIMEZONE)->subMinutes(5);
        $expired = queue_entries::where('queue_date', $date)
            ->where('status', 'called')
            ->whereNull('started_at')
            ->whereNotNull('called_at')
            ->where('called_at', '<=', $cutoff)
            ->get();

        if ($expired->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($expired) {
            $now = now(self::PH_TIMEZONE);
            foreach ($expired as $entry) {
                $entry->status = 'no-show';
                if (!$entry->completed_at) {
                    $entry->completed_at = $now;
                }
                $entry->save();

                if (!$entry->appointment_id) {
                    continue;
                }

                $appointment = Appointment::find($entry->appointment_id);
                if ($appointment && $appointment->status !== 'no_show') {
                    $appointment->status = 'no_show';
                    $appointment->save();
                    try {
                        $appointment->load(['patient', 'doctor', 'service']);
                        if (!empty($appointment->patient?->email)) {
                            Mail::to($appointment->patient->email)->send(new AppointmentNoShowPatientMail($appointment));
                        }
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
            }
        });
    }

    private function appointmentArrivalTime(Appointment $appointment): string
    {
        $time = (string) $appointment->appointment_time;
        if (!$time) {
            return now(self::PH_TIMEZONE)->format('H:i:s');
        }

        return strlen($time) === 5 ? "{$time}:00" : $time;
    }
}
