<?php

namespace App\Http\Controllers;

use App\Models\Servics;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ServicsController extends Controller
{
    /**
     * GET /api/services
     * Supports: ?search=, ?category=, ?status=
     */
    public function index(Request $request): JsonResponse
    {
        $query = Servics::query();

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('service_name', 'like', "%{$q}%")
                   ->orWhere('description',   'like', "%{$q}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $services = $query->orderBy('category')->orderBy('service_name')->get();

        return response()->json($services);
    }

    /**
     * POST /api/services
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_name'     => 'required|string|max:100',
            'description'      => 'nullable|string',
            'price'            => 'required|numeric|min:0',
            'duration_minutes' => 'nullable|integer|min:0',
            'unit'             => 'nullable|string|max:50',
            'category'         => ['required', Rule::in(['consultation','procedure','laboratory','fee'])],
            'status'           => ['nullable', Rule::in(['active','inactive'])],
        ]);

        $data['duration_minutes'] = $data['duration_minutes'] ?? 0;
        $data['unit']             = $data['unit']             ?? 'per visit';
        $data['status']           = $data['status']           ?? 'active';

        $service = Servics::create($data);

        return response()->json($service, 201);
    }

    /**
     * GET /api/services/{id}
     */
    public function show(Servics $service): JsonResponse
    {
        return response()->json($service);
    }

    /**
     * PUT /api/services/{id}
     */
    public function update(Request $request, Servics $service): JsonResponse
    {
        $data = $request->validate([
            'service_name'     => 'sometimes|required|string|max:100',
            'description'      => 'nullable|string',
            'price'            => 'sometimes|required|numeric|min:0',
            'duration_minutes' => 'nullable|integer|min:0',
            'unit'             => 'nullable|string|max:50',
            'category'         => ['sometimes', Rule::in(['consultation','procedure','laboratory','fee'])],
            'status'           => ['nullable', Rule::in(['active','inactive'])],
        ]);

        $service->update($data);

        return response()->json($service);
    }

    /**
     * DELETE /api/services/{id}
     */
    public function destroy(Servics $service): JsonResponse
    {
        $service->delete();

        return response()->json(['message' => 'Service deleted successfully.']);
    }

    /**
     * PATCH /api/services/{id}/toggle-status
     * Quickly flips active ↔ inactive without a full update
     */
    public function toggleStatus(Servics $service): JsonResponse
    {
        $service->status = $service->status === 'active' ? 'inactive' : 'active';
        $service->save();

        return response()->json($service);
    }
}