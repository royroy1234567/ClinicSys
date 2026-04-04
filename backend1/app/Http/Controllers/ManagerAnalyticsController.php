<?php

namespace App\Http\Controllers;

use App\Models\clinic_users;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ManagerAnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $request->validate([
            'range' => 'nullable|in:monthly,quarterly,yearly',
        ]);

        $range = $request->input('range', 'monthly');
        [$buckets, $start, $end] = $this->buildBuckets($range);
        $bucketKeys = array_column($buckets, 'key');
        $bucketLabels = collect($buckets)->mapWithKeys(fn ($b) => [$b['key'] => $b['label']])->all();

        $appointments = DB::table('appointments')
            ->select(['appointment_date', 'appointment_time', 'status', 'doctor_id', 'patient_id'])
            ->whereBetween('appointment_date', [$start->toDateString(), $end->toDateString()])
            ->get();

        $queueRows = DB::table('queue_entries')
            ->select([
                'queue_entry_id',
                'queue_date',
                'status',
                'source',
                'doctor_id',
                'patient_id',
                'arrival_time',
                'called_at',
                'started_at',
                'completed_at',
            ])
            ->whereBetween('queue_date', [$start->toDateString(), $end->toDateString()])
            ->get();

        $consultations = DB::table('consultations')
            ->select([
                'consultation_id',
                'queue_entry_id',
                'patient_id',
                'doctor_id',
                'session_rating',
                'updated_at',
                'follow_up_required',
                'follow_up_date',
            ])
            ->whereBetween('updated_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->orderBy('updated_at')
            ->get();

        $transactions = DB::table('transactions')
            ->select(['created_at', 'total'])
            ->whereBetween('created_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->get();

        $serviceDemandRows = DB::table('transaction_items')
            ->join('transactions', 'transactions.transaction_id', '=', 'transaction_items.transaction_id')
            ->whereBetween('transactions.created_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->groupBy('transaction_items.service_name')
            ->selectRaw('transaction_items.service_name as service_name, SUM(transaction_items.quantity) as total_qty')
            ->orderByDesc('total_qty')
            ->limit(8)
            ->get();

        $doctors = clinic_users::query()
            ->where('role', 'Doctor')
            ->select(['user_id', 'first_name', 'last_name'])
            ->get();

        $queueById = collect($queueRows)->keyBy('queue_entry_id');

        $appointmentsByBucket = $this->initMetric($bucketKeys);
        $statusCompleted = $this->initMetric($bucketKeys);
        $statusCancelled = $this->initMetric($bucketKeys);
        $statusNoShow = $this->initMetric($bucketKeys);
        $walkinByBucket = $this->initMetric($bucketKeys);
        $appointmentSourceByBucket = $this->initMetric($bucketKeys);
        $followupOverdueByBucket = $this->initMetric($bucketKeys);
        $followupUpcomingByBucket = $this->initMetric($bucketKeys);
        $engagementNewByBucket = $this->initMetric($bucketKeys);
        $engagementReturningByBucket = $this->initMetric($bucketKeys);
        $queueServedByBucket = $this->initMetric($bucketKeys);
        $queueWaitTotalByBucket = $this->initMetric($bucketKeys);
        $queueWaitCountByBucket = $this->initMetric($bucketKeys);
        $revenueByBucket = $this->initMetric($bucketKeys, 0.0);
        $patientTable = [];
        $doctorWorkload = [];
        $doctorRatingSum = [];
        $doctorRatingCount = [];
        $hourlyActual = [];
        $seenPatients = [];
        $today = Carbon::today();

        foreach ($appointments as $row) {
            $bucket = $this->bucketKey(Carbon::parse($row->appointment_date), $range);
            if (!isset($appointmentsByBucket[$bucket])) {
                continue;
            }

            $appointmentsByBucket[$bucket] += 1;
            $timeLabel = substr((string) $row->appointment_time, 0, 2) . ':00';
            $hourlyActual[$timeLabel] = ($hourlyActual[$timeLabel] ?? 0) + 1;

            $status = strtolower((string) $row->status);
            if ($status === 'completed') {
                $statusCompleted[$bucket] += 1;
            } elseif ($status === 'cancelled') {
                $statusCancelled[$bucket] += 1;
            } elseif (in_array($status, ['no_show', 'no-show'], true)) {
                $statusNoShow[$bucket] += 1;
            }
        }

        foreach ($queueRows as $row) {
            $bucket = $this->bucketKey(Carbon::parse($row->queue_date), $range);
            if (!isset($appointmentsByBucket[$bucket])) {
                continue;
            }

            $source = strtolower((string) $row->source);
            if ($source === 'walk-in' || $source === 'walkin') {
                $walkinByBucket[$bucket] += 1;
            } else {
                $appointmentSourceByBucket[$bucket] += 1;
            }

            $normalizedStatus = str_replace('-', '_', strtolower((string) $row->status));
            if ($normalizedStatus === 'completed') {
                $queueServedByBucket[$bucket] += 1;
            }
            if ($normalizedStatus === 'no_show') {
                $statusNoShow[$bucket] += 1;
            }

            if ($row->doctor_id) {
                $doctorWorkload[$row->doctor_id] = ($doctorWorkload[$row->doctor_id] ?? 0) + 1;
            }

            if ($row->patient_id) {
                if (!isset($patientTable[$row->patient_id])) {
                    $patientTable[$row->patient_id] = [
                        'patient_id' => (int) $row->patient_id,
                        'walkin' => 0,
                        'appointment' => 0,
                        'last_visit' => null,
                    ];
                }
                if ($source === 'walk-in' || $source === 'walkin') {
                    $patientTable[$row->patient_id]['walkin'] += 1;
                } else {
                    $patientTable[$row->patient_id]['appointment'] += 1;
                }
                $visitDate = Carbon::parse($row->queue_date)->toDateString();
                if (!$patientTable[$row->patient_id]['last_visit'] || $visitDate > $patientTable[$row->patient_id]['last_visit']) {
                    $patientTable[$row->patient_id]['last_visit'] = $visitDate;
                }
            }

            if ($row->arrival_time && ($row->called_at || $row->started_at)) {
                $arrival = Carbon::parse($row->queue_date . ' ' . $row->arrival_time);
                $startRef = $row->started_at ? Carbon::parse($row->started_at) : Carbon::parse($row->called_at);
                $diff = max(0, $arrival->diffInMinutes($startRef, false));
                $queueWaitTotalByBucket[$bucket] += $diff;
                $queueWaitCountByBucket[$bucket] += 1;
            }
        }

        foreach ($consultations as $row) {
            $bucket = $this->bucketKey(Carbon::parse($row->updated_at), $range);
            if (!isset($appointmentsByBucket[$bucket])) {
                continue;
            }

            if (!empty($row->patient_id)) {
                if (isset($seenPatients[$row->patient_id])) {
                    $engagementReturningByBucket[$bucket] += 1;
                } else {
                    $engagementNewByBucket[$bucket] += 1;
                    $seenPatients[$row->patient_id] = true;
                }
            }

            if ((int) $row->follow_up_required === 1 && !empty($row->follow_up_date)) {
                $followDate = Carbon::parse($row->follow_up_date);
                if ($followDate->lt($today)) {
                    $followupOverdueByBucket[$bucket] += 1;
                } else {
                    $followupUpcomingByBucket[$bucket] += 1;
                }
            }

            if (!empty($row->doctor_id)) {
                $ratedValue = isset($row->session_rating) ? (float) $row->session_rating : 0;
                if ($ratedValue > 0) {
                    $doctorRatingSum[$row->doctor_id] = ($doctorRatingSum[$row->doctor_id] ?? 0) + $ratedValue;
                    $doctorRatingCount[$row->doctor_id] = ($doctorRatingCount[$row->doctor_id] ?? 0) + 1;
                }
            }
        }

        foreach ($transactions as $row) {
            $bucket = $this->bucketKey(Carbon::parse($row->created_at), $range);
            if (!isset($revenueByBucket[$bucket])) {
                continue;
            }
            $revenueByBucket[$bucket] += (float) $row->total;
        }

        $patientNames = DB::table('patients')
            ->whereIn('id', array_keys($patientTable))
            ->select(['id', 'first_name', 'last_name'])
            ->get()
            ->mapWithKeys(fn ($p) => [(int) $p->id => trim(($p->first_name ?? '') . ' ' . ($p->last_name ?? ''))])
            ->all();

        $doctorNames = $doctors
            ->mapWithKeys(fn ($d) => [(int) $d->user_id => trim(($d->first_name ?? '') . ' ' . ($d->last_name ?? ''))])
            ->all();

        $overviewSeries = $this->toSeries($appointmentsByBucket, $bucketLabels, 'actual', 'forecast');
        $dailySeries = $this->toSeries($appointmentsByBucket, $bucketLabels, 'actual', 'forecast');
        $statusSeries = $this->buildStatusSeries($bucketLabels, $statusCompleted, $statusCancelled, $statusNoShow);
        $patientTrend = $this->buildDualSeries($bucketLabels, $walkinByBucket, $appointmentSourceByBucket, 'walkin', 'appointment');
        $followupTrend = $this->buildDualSeries($bucketLabels, $followupOverdueByBucket, $followupUpcomingByBucket, 'overdue', 'upcoming');
        $engagementTrend = $this->buildDualSeries($bucketLabels, $engagementNewByBucket, $engagementReturningByBucket, 'new_patients', 'returning_patients');
        $queueTrend = $this->buildQueueSeries($bucketLabels, $queueServedByBucket, $queueWaitTotalByBucket, $queueWaitCountByBucket);
        $salesTrend = $this->toSeries($revenueByBucket, $bucketLabels, 'revenue', 'forecast_revenue', 2);

        $hourLabels = collect(range(8, 17))
            ->map(fn ($h) => str_pad((string) $h, 2, '0', STR_PAD_LEFT) . ':00')
            ->values();
        $hourActualSeries = [];
        foreach ($hourLabels as $h) {
            $hourActualSeries[] = (float) ($hourlyActual[$h] ?? 0);
        }
        $hourForecastSeries = $this->forecast($hourActualSeries, 2);
        $dailyPeakTrend = $hourLabels->map(function ($label, $idx) use ($hourActualSeries, $hourForecastSeries) {
            return [
                'label' => $label,
                'actual' => $hourActualSeries[$idx],
                'forecast' => $hourForecastSeries[$idx],
            ];
        })->values()->all();

        $doctorRows = [];
        foreach ($doctorNames as $doctorId => $doctorName) {
            $actual = (float) ($doctorWorkload[$doctorId] ?? 0);
            $ratingsCount = (int) ($doctorRatingCount[$doctorId] ?? 0);
            $averageRating = $ratingsCount > 0
                ? round(((float) ($doctorRatingSum[$doctorId] ?? 0)) / $ratingsCount, 2)
                : 0;
            $doctorRows[] = [
                'doctor' => $doctorName ?: ('Doctor #' . $doctorId),
                'actual' => $actual,
                'forecast' => round(max(0, $actual * 1.08), 2),
                'avg_rating' => $averageRating,
                'rating_count' => $ratingsCount,
            ];
        }
        usort($doctorRows, fn ($a, $b) => $b['actual'] <=> $a['actual']);

        $serviceRows = collect($serviceDemandRows)->map(function ($row) {
            $actual = (float) $row->total_qty;
            return [
                'service' => $row->service_name ?: 'Unknown Service',
                'actual' => $actual,
                'forecast' => round(max(0, $actual * 1.1), 2),
            ];
        })->values()->all();

        $patientRows = collect($patientTable)->map(function ($row) use ($patientNames) {
            return [
                'patient_id' => $row['patient_id'],
                'patient_name' => $patientNames[$row['patient_id']] ?? ('Patient #' . $row['patient_id']),
                'walkin' => $row['walkin'],
                'appointment' => $row['appointment'],
                'total_visits' => $row['walkin'] + $row['appointment'],
                'last_visit' => $row['last_visit'],
            ];
        })->sortByDesc('total_visits')->take(12)->values()->all();

        $patientWalkinTotal = array_sum($walkinByBucket);
        $patientAppointmentTotal = array_sum($appointmentSourceByBucket);

        return response()->json([
            'range' => $range,
            'generated_at' => now()->toISOString(),
            'overview' => [
                'trend' => $overviewSeries,
                'predicted_future_demand' => round($this->lastForecastValue($overviewSeries, 'forecast'), 2),
            ],
            'daily' => [
                'trend' => $dailySeries,
                'peak_trend' => $dailyPeakTrend,
            ],
            'status' => [
                'trend' => $statusSeries,
            ],
            'doctor' => [
                'workload' => $doctorRows,
            ],
            'patient' => [
                'mix' => [
                    ['name' => 'Walk-in', 'value' => $patientWalkinTotal],
                    ['name' => 'Appointment', 'value' => $patientAppointmentTotal],
                ],
                'trend' => $patientTrend,
                'table' => $patientRows,
            ],
            'followup' => [
                'trend' => $followupTrend,
            ],
            'engagement' => [
                'trend' => $engagementTrend,
            ],
            'queue' => [
                'trend' => $queueTrend,
            ],
            'sales' => [
                'trend' => $salesTrend,
                'service_demand' => $serviceRows,
            ],
        ]);
    }

    private function initMetric(array $keys, $seed = 0): array
    {
        $out = [];
        foreach ($keys as $key) {
            $out[$key] = $seed;
        }
        return $out;
    }

    private function buildBuckets(string $range): array
    {
        $today = Carbon::today();
        $buckets = [];

        if ($range === 'yearly') {
            $start = $today->copy()->startOfMonth()->subMonths(11);
            for ($i = 0; $i < 12; $i++) {
                $point = $start->copy()->addMonths($i);
                $buckets[] = [
                    'key' => $point->format('Y-m'),
                    'label' => $point->format('M Y'),
                ];
            }
            return [$buckets, $start->copy()->startOfMonth(), $today->copy()->endOfMonth()];
        }

        if ($range === 'quarterly') {
            $start = $today->copy()->startOfWeek(Carbon::MONDAY)->subWeeks(11);
            for ($i = 0; $i < 12; $i++) {
                $point = $start->copy()->addWeeks($i);
                $buckets[] = [
                    'key' => $point->format('o-\WW'),
                    'label' => 'W' . $point->format('W') . ' ' . $point->format('Y'),
                ];
            }
            return [$buckets, $start->copy()->startOfWeek(Carbon::MONDAY), $today->copy()->endOfWeek(Carbon::SUNDAY)];
        }

        $start = $today->copy()->subDays(29);
        for ($i = 0; $i < 30; $i++) {
            $point = $start->copy()->addDays($i);
            $buckets[] = [
                'key' => $point->format('Y-m-d'),
                'label' => $point->format('M d'),
            ];
        }
        return [$buckets, $start->copy()->startOfDay(), $today->copy()->endOfDay()];
    }

    private function bucketKey(Carbon $date, string $range): string
    {
        if ($range === 'yearly') {
            return $date->format('Y-m');
        }
        if ($range === 'quarterly') {
            return $date->startOfWeek(Carbon::MONDAY)->format('o-\WW');
        }
        return $date->format('Y-m-d');
    }

    private function toSeries(array $actualByBucket, array $labels, string $actualKey = 'actual', string $forecastKey = 'forecast', int $precision = 0): array
    {
        $actualValues = array_map(fn ($key) => (float) ($actualByBucket[$key] ?? 0), array_keys($labels));
        $forecastValues = $this->forecast($actualValues, $precision);
        $rows = [];
        $i = 0;
        foreach ($labels as $key => $label) {
            $rows[] = [
                'label' => $label,
                $actualKey => round($actualValues[$i], $precision),
                $forecastKey => round($forecastValues[$i], $precision),
            ];
            $i++;
        }
        return $rows;
    }

    private function buildDualSeries(array $labels, array $left, array $right, string $leftKey, string $rightKey): array
    {
        $leftActual = array_map(fn ($key) => (float) ($left[$key] ?? 0), array_keys($labels));
        $rightActual = array_map(fn ($key) => (float) ($right[$key] ?? 0), array_keys($labels));
        $leftForecast = $this->forecast($leftActual, 0);
        $rightForecast = $this->forecast($rightActual, 0);

        $rows = [];
        $i = 0;
        foreach ($labels as $label) {
            $rows[] = [
                'label' => $label,
                $leftKey => $leftActual[$i],
                $rightKey => $rightActual[$i],
                'forecast_' . $leftKey => $leftForecast[$i],
                'forecast_' . $rightKey => $rightForecast[$i],
            ];
            $i++;
        }
        return $rows;
    }

    private function buildStatusSeries(array $labels, array $completed, array $cancelled, array $noShow): array
    {
        $completedActual = array_map(fn ($key) => (float) ($completed[$key] ?? 0), array_keys($labels));
        $cancelledActual = array_map(fn ($key) => (float) ($cancelled[$key] ?? 0), array_keys($labels));
        $noShowActual = array_map(fn ($key) => (float) ($noShow[$key] ?? 0), array_keys($labels));
        $cancelledForecast = $this->forecast($cancelledActual, 0);
        $noShowForecast = $this->forecast($noShowActual, 0);

        $rows = [];
        $i = 0;
        foreach ($labels as $label) {
            $rows[] = [
                'label' => $label,
                'completed' => $completedActual[$i],
                'cancelled' => $cancelledActual[$i],
                'no_show' => $noShowActual[$i],
                'forecast_cancelled' => $cancelledForecast[$i],
                'forecast_no_show' => $noShowForecast[$i],
            ];
            $i++;
        }
        return $rows;
    }

    private function buildQueueSeries(array $labels, array $served, array $waitTotals, array $waitCounts): array
    {
        $servedActual = array_map(fn ($key) => (float) ($served[$key] ?? 0), array_keys($labels));
        $waitActual = [];
        foreach (array_keys($labels) as $key) {
            $count = (float) ($waitCounts[$key] ?? 0);
            $waitActual[] = $count > 0 ? ((float) ($waitTotals[$key] ?? 0) / $count) : 0;
        }

        $servedForecast = $this->forecast($servedActual, 0);
        $waitForecast = $this->forecast($waitActual, 2);

        $rows = [];
        $i = 0;
        foreach ($labels as $label) {
            $rows[] = [
                'label' => $label,
                'served' => round($servedActual[$i], 0),
                'avg_wait' => round($waitActual[$i], 2),
                'forecast_served' => round($servedForecast[$i], 0),
                'forecast_wait' => round($waitForecast[$i], 2),
            ];
            $i++;
        }
        return $rows;
    }

    private function forecast(array $actualValues, int $precision = 0): array
    {
        $n = count($actualValues);
        if ($n === 0) {
            return [];
        }
        $forecast = [];
        for ($i = 0; $i < $n; $i++) {
            if ($i === 0) {
                $forecast[] = round($actualValues[$i], $precision);
                continue;
            }
            $slice = array_slice($actualValues, max(0, $i - 3), min(3, $i));
            $avg = count($slice) > 0 ? (array_sum($slice) / count($slice)) : $actualValues[$i - 1];
            $forecast[] = round($avg, $precision);
        }
        return $forecast;
    }

    private function lastForecastValue(array $series, string $forecastKey): float
    {
        if (empty($series)) {
            return 0;
        }
        $last = $series[count($series) - 1];
        return (float) ($last[$forecastKey] ?? 0);
    }
}

