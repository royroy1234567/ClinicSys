<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\ScheduleSlot;
use App\Models\queue_entries;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    /**
     * POST /api/appointments
     * Book an appointment (patient must be authenticated).
     */
    public function store(Request $request)
    {
        $request->validate([
            'doctor_id'        => 'required|integer|exists:clinic_users,user_id',
            'service_id'       => 'nullable|integer|exists:services,service_id',
            'appointment_date' => 'required|date_format:Y-m-d|after:today',
            'appointment_time' => 'required|date_format:H:i',
            'reason'           => 'required|string|max:500',
            'notes'            => 'nullable|string|max:1000',
        ]);

        $patientId = $request->user()->id;
        $date      = $request->appointment_date;
        $time      = $request->appointment_time;
        $doctorId  = $request->doctor_id;

        $hasActiveAppointment = Appointment::where('patient_id', $patientId)
            ->where('status', 'scheduled')
            ->whereDate('appointment_date', '>=', now()->toDateString())
            ->exists();

        if ($hasActiveAppointment) {
            return response()->json([
                'message' => 'You already have an active appointment. Complete, cancel, or mark no-show before booking another.',
            ], 422);
        }

        // Find the schedule for this doctor + date
        $schedule = DoctorSchedule::where('user_id', $doctorId)
            ->where('schedule_date', $date)
            ->first();

        if (!$schedule) {
            return response()->json(['message' => 'No schedule found for this doctor on the selected date.'], 422);
        }

        // Find the slot that covers this time
        $slot = ScheduleSlot::where('schedule_id', $schedule->schedule_id)
            ->whereRaw("TIME(?) >= start_time AND TIME(?) < end_time", [$time, $time])
            ->first();

        if (!$slot) {
            return response()->json(['message' => 'Selected time is not within any available slot.'], 422);
        }

        // Check if slot is still available (not over max_patients / booked count)
        $slotDuration  = $slot->duration;
        $slotStartMins = self::toMins($slot->start_time);
        $slotEndMins   = self::toMins($slot->end_time);
        $timeMins      = self::toMins($time);

        // Compute position of this time within the slot
        $totalInSlot = $slotDuration > 0
            ? (int) floor(($slotEndMins - $slotStartMins) / $slotDuration)
            : 0;

        // Check existing booked count
        $alreadyBooked = Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('appointment_time', $time . ':00')
            ->whereNotIn('status', ['cancelled'])
            ->count();

        if ($alreadyBooked > 0) {
            return response()->json(['message' => 'This time slot is already taken.'], 422);
        }

        /** @var Appointment $appointment */
        $appointment = DB::transaction(function () use ($request, $patientId, $slot): Appointment {
            $apt = Appointment::create([
                'patient_id'       => $patientId,
                'doctor_id'        => $request->doctor_id,
                'service_id'       => $request->service_id,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
                'reason'           => $request->reason,
                'notes'            => $request->notes,
                'status'           => 'scheduled',
            ]);

            // Increment booked count on the slot
            $slot->increment('booked');

            return $apt;
        });

        return response()->json([
            'message'        => 'Appointment booked successfully.',
            'appointment_id' => $appointment->appointment_id,
            'status'         => 'scheduled',
        ], 201);
    }

    /**
     * GET /api/appointments
     * List appointments for the logged-in patient.
     */
    public function index(Request $request)
{
    $noShowAppointmentIds = queue_entries::whereNotNull('appointment_id')
        ->where('status', 'no-show')
        ->pluck('appointment_id')
        ->unique()
        ->values()
        ->all();

    if (!empty($noShowAppointmentIds)) {
        Appointment::whereIn('appointment_id', $noShowAppointmentIds)
            ->where('status', '!=', 'no_show')
            ->update(['status' => 'no_show']);
    }

    $completedAppointmentIds = queue_entries::whereNotNull('appointment_id')
        ->where('status', 'completed')
        ->when(!empty($noShowAppointmentIds), fn($q) => $q->whereNotIn('appointment_id', $noShowAppointmentIds))
        ->pluck('appointment_id')
        ->unique()
        ->values()
        ->all();

    if (!empty($completedAppointmentIds)) {
        Appointment::whereIn('appointment_id', $completedAppointmentIds)
            ->whereNotIn('status', ['completed', 'no_show'])
            ->update(['status' => 'completed']);
    }

    $user = $request->user();
    $isStaff = in_array($user->role, ['Admin', 'Staff', 'Doctor']); // adjust roles to match yours

    $query = Appointment::with(['doctor', 'service', 'patient']);

    if ($isStaff) {
        // Staff — fetch all appointments
        $query->orderByDesc('appointment_date')
              ->orderByDesc('appointment_time');
    } else {
        // Patient — fetch only their own
        $query->where('patient_id', $user->id)
              ->orderByDesc('appointment_date')
              ->orderByDesc('appointment_time');
    }

    $appointments = $query->get()->map(fn($a) => [
        'appointment_id'   => $a->appointment_id,
        'patient_name'     => $a->patient
            ? trim(($a->patient->first_name ?? '') . ' ' . ($a->patient->last_name ?? ''))
            : '—',
        'doctor_name'      => $a->doctor
            ? trim(($a->doctor->first_name ?? '') . ' ' . ($a->doctor->last_name ?? ''))
            : '—',
        'service_name'     => $a->service?->service_name ?? '—',
        'appointment_date' => $a->appointment_date instanceof \Carbon\Carbon
            ? $a->appointment_date->format('Y-m-d')
            : $a->appointment_date,
        'appointment_time' => substr($a->appointment_time, 0, 5),
        'reason'           => $a->reason,
        'notes'            => $a->notes,
        'status'           => $a->status,
        'queue_number'     => $a->queue_number ?? null,
    ]);

    return response()->json($appointments);
}

    /**
     * DELETE /api/appointments/{id}
     * Cancel an appointment (patient only, if still scheduled).
     */
    public function destroy(Request $request, $id)
    {
        $appointment = Appointment::where('appointment_id', $id)
            ->where('patient_id', $request->user()->id)
            ->firstOrFail();

        if ($appointment->status !== 'scheduled') {
            return response()->json(['message' => 'Only scheduled appointments can be cancelled.'], 422);
        }

        DB::transaction(function () use ($appointment) {
            $appointment->update(['status' => 'cancelled']);

            // Find and decrement the slot booked count
            $schedule = DoctorSchedule::where('user_id', $appointment->doctor_id)
                ->where('schedule_date', $appointment->appointment_date)
                ->first();

            if ($schedule) {
                $slot = ScheduleSlot::where('schedule_id', $schedule->schedule_id)
                    ->whereRaw("TIME(?) >= start_time AND TIME(?) < end_time",
                        [$appointment->appointment_time, $appointment->appointment_time])
                    ->first();

                if ($slot && $slot->booked > 0) {
                    $slot->decrement('booked');
                }
            }
        });

        return response()->json(['message' => 'Appointment cancelled.']);
    }

    private static function toMins(string $time): int
    {
        [$h, $m] = explode(':', $time);
        return (int)$h * 60 + (int)$m;
    }
}
