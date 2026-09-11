<?php

namespace App\Http\Controllers;

use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function __construct(
        private readonly CommissionService $commissionService
    ) {}

    /**
     * POST /api/sales/{saleId}/commission
     * Calculate (and store) the commission for a single completed sale.
     * Call this right after a sale is marked 'completed'.
     */
    public function calculateForSale(int $saleId): JsonResponse
    {
        return response()->json(
            $this->commissionService->calculateForSale($saleId)
        );
    }

    /**
     * GET /api/users/{userId}/commissions?from=2026-07-01&to=2026-07-31
     * Total commissions for one seller within a date range (payout report).
     */
    public function forSeller(Request $request, int $userId): JsonResponse
    {
        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to = $request->query('to', now()->endOfMonth()->toDateString());

        return response()->json(
            $this->commissionService->totalForSeller($userId, $from, $to)
        );
    }

    /**
     * GET /api/commissions/summary?from=2026-07-01&to=2026-07-31
     * Commission summary across all sellers (end-of-month payout dashboard).
     */
    public function summary(Request $request): JsonResponse
    {
        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to = $request->query('to', now()->endOfMonth()->toDateString());

        return response()->json(
            $this->commissionService->summaryForAllSellers($from, $to)
        );
    }
}
