<?php

namespace App\Http\Controllers;

use App\Models\DoctorSchedule;
use App\Models\ScheduleSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DoctorScheduleController extends Controller
{
    /**
     * GET /api/doctor_schedules?user_id=1
     * Returns all schedules for a doctor, formatted for the frontend.
     */
    public function index(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:clinic_users,user_id',
        ]);

        $today = now()->toDateString();

        DB::transaction(function () use ($request, $today) {
            DoctorSchedule::where('user_id', $request->user_id)
                ->whereDate('schedule_date', '<', $today)
                ->delete();
        });

        $schedules = DoctorSchedule::with('slots')
            ->where('user_id', $request->user_id)
            ->whereDate('schedule_date', '>=', $today)
            ->get();

        $result = [];
        foreach ($schedules as $schedule) {
            $result[$schedule->schedule_date->format('Y-m-d')] = $this->formatSchedule($schedule);
        }

        return response()->json($result);
    }

    /**
     * POST /api/doctor_schedules
     * Create or update a schedule for a specific date.
     * Also handles repeat logic.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id'          => 'required|integer|exists:clinic_users,user_id',
            'schedule_date'    => 'required|date_format:Y-m-d|after_or_equal:today',
            'repeat'           => 'boolean',
            'repeat_weeks'     => 'integer|min:1|max:52',
            'slots'            => 'nullable|array',
            'slots.*.start'    => 'required_with:slots|date_format:H:i',
            'slots.*.end'      => 'required_with:slots|date_format:H:i',
            'slots.*.duration' => 'required_with:slots|integer|in:15,20,30,45,60',
            'slots.*.maxPts'   => 'nullable|integer|min:0',
            'slots.*.booked'   => 'nullable|integer|min:0',
        ]);

        $dates = [$request->schedule_date];

        if ($request->repeat && $request->repeat_weeks > 1) {
            $base = Carbon::parse($request->schedule_date);
            for ($w = 1; $w < $request->repeat_weeks; $w++) {
                $dates[] = $base->copy()->addWeeks($w)->format('Y-m-d');
            }
        }

        DB::transaction(function () use ($request, $dates) {
            foreach ($dates as $index => $date) {
                if ($index > 0 && $date < now()->format('Y-m-d')) {
                    continue;
                }

                $schedule = DoctorSchedule::updateOrCreate(
                    ['user_id' => $request->user_id, 'schedule_date' => $date],
                    [
                        'repeat'       => $request->boolean('repeat'),
                        'repeat_weeks' => $request->repeat_weeks ?? 4,
                    ]
                );

                // Sync slots — delete unbooked, re-insert
                $schedule->slots()->where('booked', 0)->delete();

                foreach ($request->slots ?? [] as $slotData) {
                    $booked = ($index === 0) ? ($slotData['booked'] ?? 0) : 0;

                    ScheduleSlot::create([
                        'schedule_id'  => $schedule->schedule_id,
                        'start_time'   => $slotData['start'],
                        'end_time'     => $slotData['end'],
                        'duration'     => $slotData['duration'],
                        'max_patients' => $slotData['maxPts'] ?? 0,
                        'booked'       => $booked,
                    ]);
                }
            }
        });

        return response()->json([
            'message'        => 'Schedule saved successfully.',
            'dates_affected' => count($dates),
        ], 201);
    }

    /**
     * DELETE /api/doctor_schedules/{user_id}/{date}
     */
    public function destroy($userId, $date)
    {
        $schedule = DoctorSchedule::with('slots')
            ->where('user_id', $userId)
            ->where('schedule_date', $date)
            ->firstOrFail();

        $hasBookings = $schedule->slots->where('booked', '>', 0)->isNotEmpty();
        if ($hasBookings) {
            return response()->json([
                'message' => 'Cannot clear a date with existing bookings.',
            ], 422);
        }

        $schedule->delete();

        return response()->json(['message' => 'Schedule cleared.']);
    }

    /**
     * GET /api/doctor_schedules/{user_id}/{date}
     */
    public function show($userId, $date)
    {
        $schedule = DoctorSchedule::with('slots')
            ->where('user_id', $userId)
            ->where('schedule_date', $date)
            ->first();

        if (!$schedule) {
            return response()->json(null);
        }

        return response()->json($this->formatSchedule($schedule));
    }

    /**
     * Format a DoctorSchedule model for the frontend.
     */
    private function formatSchedule(DoctorSchedule $schedule): array
    {
        return [
            'repeat'      => $schedule->repeat,
            'repeatWeeks' => $schedule->repeat_weeks,
            'slots'       => $schedule->slots->map(fn($slot) => [
                'id'       => $slot->slot_id,
                'start'    => substr($slot->start_time, 0, 5),
                'end'      => substr($slot->end_time,   0, 5),
                'duration' => $slot->duration,
                'maxPts'   => $slot->max_patients,
                'booked'   => $slot->booked,
            ])->values()->toArray(),
        ];
    }
}
