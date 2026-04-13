<?php

namespace App\Http\Controllers;

use App\Mail\ConsultationFeedbackResponseMail;
use App\Models\Consultation;
use App\Models\Transaction;
use App\Models\queue_entries;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class ConsultationController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'doctor_id' => 'nullable|integer|exists:clinic_users,user_id',
            'patient_id' => 'nullable|integer|exists:patients,id',
            'status' => 'nullable|in:draft,ongoing,completed,cancelled',
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
        ]);

        $query = Consultation::with(['patient', 'doctor', 'queueEntry']);

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }
        if (strtolower((string) $request->user()->role) === 'patient') {
            $query->where('patient_id', $request->user()->id)
                ->whereNotNull('finalized_at');
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('from')) {
            $query->whereDate('updated_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('updated_at', '<=', $request->input('to'));
        }

        $rows = $query
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn(Consultation $c) => $this->formatConsultation($c, true));

        return response()->json($rows);
    }

    public function byQueueEntry($queueEntryId)
    {
        $entry = queue_entries::with(['patient', 'doctor'])->findOrFail($queueEntryId);
        $consultation = Consultation::where('queue_entry_id', $entry->queue_entry_id)->first();

        if (!$consultation) {
            return response()->json([
                'queue_entry_id' => $entry->queue_entry_id,
                'patient_id' => $entry->patient_id,
                'doctor_id' => $entry->doctor_id,
                'status' => 'draft',
                'chief_complaint' => null,
                'blood_pressure' => null,
                'temperature' => null,
                'heart_rate' => null,
                'weight' => null,
                'diagnosis' => null,
                'notes' => null,
                'treatment_items' => [],
                'lab_requests' => [],
                'follow_up_required' => false,
                'follow_up_date' => null,
                'follow_up_notes' => null,
                'session_started_at' => null,
                'completed_at' => null,
                'finalized_at' => null,
            ]);
        }

        return response()->json($this->formatConsultation($consultation, true));
    }

    public function upsertByQueueEntry(Request $request, $queueEntryId)
    {
        $entry = queue_entries::findOrFail($queueEntryId);

        $request->validate([
            'chief_complaint' => 'nullable|string',
            'blood_pressure' => 'nullable|string|max:50',
            'temperature' => 'nullable|string|max:50',
            'heart_rate' => 'nullable|string|max:50',
            'weight' => 'nullable|string|max:50',
            'diagnosis' => 'nullable|string',
            'notes' => 'nullable|string',
            'treatment_items' => 'nullable|array',
            'lab_requests' => 'nullable|array',
            'follow_up_required' => 'nullable|boolean',
            'follow_up_date' => 'nullable|date|after:today',
            'follow_up_notes' => 'nullable|string',
            'status' => 'nullable|in:draft,ongoing,completed,cancelled',
        ]);

        if ($request->boolean('follow_up_required') && !$request->filled('follow_up_date')) {
            return response()->json([
                'message' => 'Follow-up date is required when follow-up is marked as required.',
            ], 422);
        }

        $consultation = Consultation::firstOrNew(['queue_entry_id' => $entry->queue_entry_id]);
        $consultation->patient_id = $entry->patient_id;
        $consultation->doctor_id = $entry->doctor_id;

        $consultation->chief_complaint = $request->input('chief_complaint', $consultation->chief_complaint);
        $consultation->blood_pressure = $request->input('blood_pressure', $consultation->blood_pressure);
        $consultation->temperature = $request->input('temperature', $consultation->temperature);
        $consultation->heart_rate = $request->input('heart_rate', $consultation->heart_rate);
        $consultation->weight = $request->input('weight', $consultation->weight);
        $consultation->diagnosis = $request->input('diagnosis', $consultation->diagnosis);
        $consultation->notes = $request->input('notes', $consultation->notes);
        $consultation->treatment_items = $request->input('treatment_items', $consultation->treatment_items ?? []);
        $consultation->lab_requests = $request->input('lab_requests', $consultation->lab_requests ?? []);
        $followUpRequired = (bool) $request->input('follow_up_required', $consultation->follow_up_required ?? false);
        $consultation->follow_up_required = $followUpRequired;
        $consultation->follow_up_date = $followUpRequired
            ? $request->input('follow_up_date', $consultation->follow_up_date)
            : null;
        $consultation->follow_up_notes = $followUpRequired
            ? $request->input('follow_up_notes', $consultation->follow_up_notes)
            : null;

        $requestedStatus = $request->input('status');
        if ($requestedStatus) {
            $consultation->status = $requestedStatus;
            if ($requestedStatus === 'ongoing' && !$consultation->session_started_at) {
                $consultation->session_started_at = now();
            }
            if ($requestedStatus === 'completed') {
                $consultation->completed_at = now();
            }
        }

        $consultation->save();

        return response()->json($this->formatConsultation($consultation, true));
    }

    public function rate(Request $request, $consultationId)
    {
        $request->validate([
            'session_rating' => 'required|integer|min:1|max:5',
            'session_feedback' => 'nullable|string|max:1500',
        ]);

        $consultation = Consultation::findOrFail($consultationId);

        if (strtolower((string) $request->user()->role) === 'patient' && (int) $consultation->patient_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'You can only rate your own completed sessions.'], 403);
        }

        if (!$consultation->finalized_at) {
            return response()->json(['message' => 'Only finalized consultations can be rated.'], 422);
        }

        $consultation->session_rating = (int) $request->input('session_rating');
        $consultation->session_feedback = $request->input('session_feedback');
        $consultation->session_rated_at = now();
        $consultation->feedback_response_status = 'pending';
        $consultation->feedback_responded_at = null;
        $consultation->save();

        return response()->json($this->formatConsultation($consultation->fresh(), true));
    }

    public function respondToFeedback(Request $request, $consultationId)
    {
        $role = strtolower((string) ($request->user()->role ?? ''));
        if ($role !== 'manager') {
            return response()->json(['message' => 'Only managers can send feedback responses.'], 403);
        }

        $request->validate([
            'message' => 'required|string|min:5|max:3000',
        ]);

        $consultation = Consultation::with(['patient', 'doctor'])->findOrFail($consultationId);
        $patient = $consultation->patient;

        if (!$patient || empty($patient->email)) {
            return response()->json(['message' => 'Patient email is not available for this consultation.'], 422);
        }

        $managerName = trim((string) ($request->user()->name ?? 'Manager'));

        Mail::to($patient->email)->send(new ConsultationFeedbackResponseMail(
            consultation: $consultation,
            responseMessage: (string) $request->input('message'),
            responderName: $managerName
        ));

        $consultation->feedback_response_status = 'responded';
        $consultation->feedback_responded_at = now();
        $consultation->save();

        return response()->json(['message' => 'Response sent to patient email.']);
    }

    private function formatConsultation(Consultation $c, bool $withRelations = false): array
    {
        $payload = [
            'consultation_id' => $c->consultation_id,
            'consultation_number' => $c->consultation_number ?: $c->buildConsultationNumber(),
            'queue_entry_id' => $c->queue_entry_id,
            'patient_id' => $c->patient_id,
            'doctor_id' => $c->doctor_id,
            'chief_complaint' => $c->chief_complaint,
            'blood_pressure' => $c->blood_pressure,
            'temperature' => $c->temperature,
            'heart_rate' => $c->heart_rate,
            'weight' => $c->weight,
            'diagnosis' => $c->diagnosis,
            'notes' => $c->notes,
            'treatment_items' => $c->treatment_items ?? [],
            'lab_requests' => $c->lab_requests ?? [],
            'follow_up_required' => (bool) $c->follow_up_required,
            'follow_up_date' => $c->follow_up_date ? $c->follow_up_date->format('Y-m-d') : null,
            'follow_up_notes' => $c->follow_up_notes,
            'session_rating' => $c->session_rating,
            'session_feedback' => $c->session_feedback,
            'session_rated_at' => $c->session_rated_at?->toISOString(),
            'rating_status' => $c->session_rating ? 'rated' : 'not_yet_rated',
            'feedback_response_status' => $c->feedback_response_status ?: 'pending',
            'feedback_responded_at' => $c->feedback_responded_at?->toISOString(),
            'status' => $c->status,
            'session_started_at' => $c->session_started_at?->toISOString(),
            'completed_at' => $c->completed_at?->toISOString(),
            'finalized_at' => $c->finalized_at?->toISOString(),
            'updated_at' => $c->updated_at?->toISOString(),
        ];

        $today = Carbon::today();
        $followUpDate = $c->follow_up_date ? Carbon::parse($c->follow_up_date) : null;
        $isFollowUpExpired = $c->follow_up_required && $followUpDate && $followUpDate->lt($today);
        $hasValidFollowUp = $c->follow_up_required && $followUpDate && !$isFollowUpExpired;

        $payload['follow_up_expired'] = (bool) $isFollowUpExpired;
        $payload['follow_up_status'] = $hasValidFollowUp
            ? 'followup_pending'
            : ($isFollowUpExpired ? 'followup_expired' : 'none');

        if (!$withRelations) {
            return $payload;
        }

        $patient = $c->patient;
        $doctor = $c->doctor;
        $queue = $c->queueEntry;

        $payload['patient_name'] = $patient
            ? trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? ''))
            : null;
        $payload['doctor_name'] = $doctor
            ? trim(($doctor->first_name ?? '') . ' ' . ($doctor->last_name ?? ''))
            : null;
        $payload['patient'] = $patient ? [
            'id' => $patient->id,
            'name' => trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? '')),
            'age' => $patient->age,
            'gender' => $patient->gender,
            'contact' => $patient->mobile,
            'email' => $patient->email,
            'address' => trim(implode(', ', array_filter([$patient->street, $patient->city, $patient->province]))),
            'allergies' => $patient->allergies,
            'conditions' => $patient->conditions,
        ] : null;
        $payload['queue'] = $queue ? [
            'queue_date' => $queue->queue_date ? $queue->queue_date->format('Y-m-d') : null,
            'queue_number' => $queue->queue_number,
            'source' => $queue->source,
            'priority' => $queue->priority,
            'status' => str_replace('-', '_', (string) $queue->status),
            'arrival_time' => $queue->arrival_time ? substr((string) $queue->arrival_time, 0, 5) : null,
        ] : null;

        $payment = null;
        if ($queue) {
            $payment = Transaction::with(['items', 'staff'])
                ->where('queue_entry_id', $queue->queue_entry_id)
                ->latest('created_at')
                ->first();
        }

        $payload['payment_details'] = $payment ? [
            'transaction_id' => $payment->transaction_id,
            'transaction_number' => $payment->transaction_number,
            'payment_method' => $payment->payment_method,
            'amount_tendered' => $payment->amount_tendered,
            'change_amount' => $payment->change_amount,
            'subtotal' => $payment->subtotal,
            'discount' => $payment->discount,
            'total' => $payment->total,
            'status' => $payment->status,
            'items' => $payment->items->map(fn($i) => [
                'service_name' => $i->service_name,
                'unit_price' => $i->unit_price,
                'quantity' => $i->quantity,
                'subtotal' => $i->subtotal,
            ])->values()->toArray(),
        ] : null;

        $payload['receipt_info'] = $payment ? [
            'receipt_number' => $payment->transaction_number,
            'issued_at' => $payment->created_at?->toISOString(),
            'cashier' => $payment->staff
                ? trim(($payment->staff->first_name ?? '') . ' ' . ($payment->staff->last_name ?? ''))
                : null,
        ] : null;

        return $payload;
    }
}
