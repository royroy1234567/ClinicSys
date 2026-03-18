<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    /**
     * GET /api/transactions
     * Supports: ?date=, ?patient=, ?status=
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['patient', 'staff', 'items'])
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

        $transactions = $query->get()->map(function ($t) {
            return $this->formatTransaction($t);
        });

        return response()->json($transactions);
    }

    /**
     * POST /api/transactions
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id'      => 'nullable|exists:patients,id',
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

        $transaction = Transaction::create([
            'patient_id'      => $data['patient_id'] ?? null,
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
                'transaction_id' => $transaction->transaction_id,
                'service_id'     => $item['service_id'],
                'service_name'   => $item['service_name'],
                'unit_price'     => $item['unit_price'],
                'quantity'       => $item['quantity'],
                'subtotal'       => $item['subtotal'],
            ]);
        }

        $transaction->load(['patient', 'staff', 'items']);

        return response()->json($this->formatTransaction($transaction), 201);
    }

    /**
     * GET /api/transactions/{id}
     */
    public function show(Transaction $transaction): JsonResponse
    {
        $transaction->load(['patient', 'staff', 'items']);
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
            'patient_id'      => $t->patient_id,
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
