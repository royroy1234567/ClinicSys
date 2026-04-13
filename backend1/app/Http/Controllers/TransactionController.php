<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Consultation;
use App\Models\queue_entries;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Collection;
use Illuminate\Support\Carbon;
use App\Mail\ConsultationCompletedPatientMail;

class TransactionController extends Controller
{
    /**
     * GET /api/transactions
     * Supports: ?date=, ?patient=, ?status=
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['patient', 'staff', 'items', 'queueEntry'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('patient')) {
            $q = $request->patient;
            $query->whereHas('patient', function ($pq) use ($q) {
                $pq->where('first_name', 'like', "%{$q}%")
                   ->orWhere('last_name',  'like', "%{$q}%");
            });
        }

        if ($request->filled('appointment_reference')) {
            $q = trim((string) $request->appointment_reference);
            $query->where('transaction_number', 'like', "%{$q}%");
        }

        $transactions = $query->get()->map(function ($t) {
            return $this->formatTransaction($t);
        });

        return response()->json($transactions);
    }

    /**
     * GET /api/transactions/pending-payments
     * List completed queue entries for today that still have no payment.
     */
    public function pendingPayments(Request $request): JsonResponse
    {
        $date = $request->query('date', now()->toDateString());

        $paidQueueEntryIds = Transaction::query()
            ->whereDate('created_at', $date)
            ->whereNotNull('queue_entry_id')
            ->pluck('queue_entry_id')
            ->unique()
            ->toArray();

        $entries = queue_entries::with(['patient', 'doctor', 'appointment.service', 'service'])
            ->whereDate('queue_date', $date)
            ->where('status', 'completed')
            ->when(!empty($paidQueueEntryIds), function ($q) use ($paidQueueEntryIds) {
                $q->whereNotIn('queue_entry_id', $paidQueueEntryIds);
            })
            ->orderByDesc(DB::raw('COALESCE(completed_at, updated_at)'))
            ->get();

        $rows = $entries
            ->groupBy('patient_id')
            ->map(function (Collection $patientEntries) {
                $latest = $patientEntries->first();
                $services = $patientEntries
                    ->map(function ($entry) {
                        $serviceRows = [];

                        if ($entry->source === 'appointment' && $entry->appointment?->service) {
                            $serviceRows[] = [
                                'service_id' => $entry->appointment->service->service_id,
                                'service_name' => $entry->appointment->service->service_name,
                                'unit_price' => (float) $entry->appointment->service->price,
                                'quantity' => 1,
                                'source' => 'appointment',
                            ];
                        }

                        if ($entry->source === 'walk-in' && $entry->service) {
                            $serviceRows[] = [
                                'service_id' => $entry->service->service_id,
                                'service_name' => $entry->service->service_name,
                                'unit_price' => (float) $entry->service->price,
                                'quantity' => 1,
                                'source' => 'walkin',
                            ];
                        }
                        return $serviceRows;
                    })
                    ->flatten(1)
                    ->groupBy('service_name')
                    ->map(function ($grouped, $name) {
                        $first = $grouped->first();
                        return [
                            'service_id' => $first['service_id'],
                            'service_name' => $name,
                            'unit_price' => (float) ($first['unit_price'] ?? 0),
                            'quantity' => $grouped->sum('quantity'),
                            'subtotal' => (float) ($first['unit_price'] ?? 0) * $grouped->sum('quantity'),
                            'source' => $first['source'] ?? 'appointment',
                        ];
                    })
                    ->values();

                return [
                    'queue_entry_id' => $latest->queue_entry_id,
                    'queue_number' => $latest->queue_number,
                    'queue_date' => $latest->queue_date ? $latest->queue_date->format('Y-m-d') : null,
                    'patient_id' => $latest->patient_id,
                    'patient_name' => trim(($latest->patient->first_name ?? '') . ' ' . ($latest->patient->last_name ?? '')),
                    'patient_email' => $latest->patient->email ?? null,
                    'patient_contact' => $latest->patient->mobile ?? null,
                    'doctor_id' => $latest->doctor_id,
                    'doctor_name' => $latest->doctor ? trim(($latest->doctor->first_name ?? '') . ' ' . ($latest->doctor->last_name ?? '')) : null,
                    'status' => str_replace('-', '_', $latest->status),
                    'source' => str_replace('-', '', (string) $latest->source),
                    'completed_at' => $latest->completed_at?->toISOString(),
                    'pending_entries' => $patientEntries->count(),
                    'services' => $services,
                ];
            })
            ->values();

        return response()->json($rows);
    }

    /**
     * POST /api/transactions
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id'      => 'nullable|exists:patients,id',
            'queue_entry_id'  => 'nullable|exists:queue_entries,queue_entry_id',
            'items'           => 'required|array|min:1',
            'items.*.service_id'   => 'required|exists:services,service_id',
            'items.*.service_name' => 'required|string',
            'items.*.unit_price'   => 'required|numeric|min:0',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.subtotal'     => 'required|numeric|min:0',
            'discount'        => 'nullable|numeric|min:0',
            'payment_method'  => 'required|in:cash,card,gcash,maya',
            'amount_tendered' => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string',
        ]);

        $subtotal = collect($data['items'])->sum('subtotal');
        $discount = $data['discount'] ?? 0;
        $total    = max(0, $subtotal - $discount);

        $changeAmount = null;
        if ($data['payment_method'] === 'cash' && isset($data['amount_tendered'])) {
            $changeAmount = max(0, $data['amount_tendered'] - $total);
        }

        if ($data['payment_method'] === 'cash' && (!isset($data['amount_tendered']) || (float) $data['amount_tendered'] < $total)) {
            return response()->json([
                'message' => 'Amount tendered is insufficient.',
            ], 422);
        }

        $transaction = DB::transaction(function () use ($request, $data, $subtotal, $discount, $total, $changeAmount) {
            $today = Carbon::today();
            $prefix = $today->format('Y-md');
            $dailyCount = Transaction::whereDate('created_at', $today)->lockForUpdate()->count() + 1;
            $transactionNumber = sprintf('%s%02d', $prefix, $dailyCount);

            $created = Transaction::create([
                'transaction_number' => $transactionNumber,
                'patient_id'      => $data['patient_id'] ?? null,
                'queue_entry_id'  => $data['queue_entry_id'] ?? null,
                'staff_id'        => $request->user()->user_id,
                'subtotal'        => $subtotal,
                'discount'        => $discount,
                'total'           => $total,
                'payment_method'  => $data['payment_method'],
                'amount_tendered' => $data['amount_tendered'] ?? null,
                'change_amount'   => $changeAmount,
                'status'          => 'paid',
                'notes'           => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                TransactionItem::create([
                    'transaction_id' => $created->transaction_id,
                    'service_id'     => $item['service_id'],
                    'service_name'   => $item['service_name'],
                    'unit_price'     => $item['unit_price'],
                    'quantity'       => $item['quantity'],
                    'subtotal'       => $item['subtotal'],
                ]);
            }

            if (!empty($data['queue_entry_id'])) {
                $consultation = Consultation::where('queue_entry_id', $data['queue_entry_id'])->first();
                if ($consultation) {
                    $consultation->status = 'completed';
                    if (!$consultation->completed_at) {
                        $consultation->completed_at = now();
                    }
                    $consultation->finalized_at = now();
                    $consultation->save();
                }

                $queueEntry = queue_entries::find($data['queue_entry_id']);
                if ($queueEntry && $queueEntry->status !== 'completed') {
                    $queueEntry->status = 'completed';
                    if (!$queueEntry->completed_at) {
                        $queueEntry->completed_at = now();
                    }
                    $queueEntry->save();
                }
            }

            return $created;
        });

        $transaction->load(['patient', 'staff', 'items', 'queueEntry']);

        try {
            if ($transaction->queue_entry_id) {
                $consultation = Consultation::with(['patient', 'doctor'])
                    ->where('queue_entry_id', $transaction->queue_entry_id)
                    ->first();
                if ($consultation && !empty($consultation->patient?->email)) {
                    Mail::to($consultation->patient->email)
                        ->send(new ConsultationCompletedPatientMail($consultation, $transaction));
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json($this->formatTransaction($transaction), 201);
    }

    /**
     * GET /api/transactions/{id}
     */
    public function show(Transaction $transaction): JsonResponse
    {
        $transaction->load(['patient', 'staff', 'items', 'queueEntry']);
        return response()->json($this->formatTransaction($transaction));
    }

    /**
     * Format a transaction for the API response.
     */
    private function formatTransaction(Transaction $t): array
    {
        $patient = $t->patient;
        return [
            'transaction_id'  => $t->transaction_id,
            'transaction_number' => $t->transaction_number,
            'patient_id'      => $t->patient_id,
            'queue_entry_id'  => $t->queue_entry_id,
            'patient_name'    => $patient
                ? trim("{$patient->first_name} {$patient->last_name}")
                : 'Walk-in',
            'staff_id'        => $t->staff_id,
            'staff_name'      => $t->staff
                ? trim("{$t->staff->first_name} {$t->staff->last_name}")
                : '',
            'subtotal'        => $t->subtotal,
            'discount'        => $t->discount,
            'total'           => $t->total,
            'payment_method'  => $t->payment_method,
            'amount_tendered' => $t->amount_tendered,
            'change_amount'   => $t->change_amount,
            'status'          => $t->status,
            'notes'           => $t->notes,
            'receipt_info'    => [
                'receipt_number' => $t->transaction_number,
                'issued_at' => $t->created_at?->toISOString(),
                'cashier' => $t->staff
                    ? trim("{$t->staff->first_name} {$t->staff->last_name}")
                    : '',
            ],
            'payment_details' => [
                'method' => $t->payment_method,
                'status' => $t->status,
                'amount_tendered' => $t->amount_tendered,
                'change_amount' => $t->change_amount,
                'subtotal' => $t->subtotal,
                'discount' => $t->discount,
                'total' => $t->total,
            ],
            'items'           => $t->items->map(fn($i) => [
                'item_id'      => $i->item_id,
                'service_id'   => $i->service_id,
                'service_name' => $i->service_name,
                'unit_price'   => $i->unit_price,
                'quantity'     => $i->quantity,
                'subtotal'     => $i->subtotal,
            ])->values(),
            'created_at'      => $t->created_at,
        ];
    }
}
