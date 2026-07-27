<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * GET /api/audit-logs?user_id=&event=&auditable_type=&from=&to=
     *
     * Read-only — audit logs are only ever created by the Auditable trait
     * and the login/logout listeners, never through this API.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'user_id'        => 'nullable|integer',
            'event'          => 'nullable|string',
            'auditable_type' => 'nullable|string',
            'from'           => 'nullable|date',
            'to'             => 'nullable|date',
        ]);

        $query = AuditLog::with('user')->latest('created_at');

        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (!empty($validated['event'])) {
            $query->where('event', $validated['event']);
        }

        if (!empty($validated['auditable_type'])) {
            $query->where('auditable_type', $validated['auditable_type']);
        }

        if (!empty($validated['from']) && !empty($validated['to'])) {
            $query->whereBetween('created_at', [$validated['from'], $validated['to']]);
        }

        return $query->paginate(20);
    }

    public function show(AuditLog $auditLog)
    {
        return $auditLog->load('user');
    }
}
