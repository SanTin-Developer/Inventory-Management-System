<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * CommissionService
 *
 * Calculates and records seller commissions based on a percentage
 * of completed sales. Each user has a `commission_rate` (%) on the
 * users table; each completed sale generates one commission record.
 *
 * Schema notes:
 *   users(user_id PK, ..., commission_rate)
 *   sales(sale_id PK, user_id, total_amount, status, sale_date, ...)
 *   commissions(commission_id PK, sale_id, user_id, sale_amount,
 *               commission_rate, commission_amount, timestamps)
 */
class CommissionService
{
    /**
     * Calculate and store the commission for a single sale.
     * Safe to call more than once — won't duplicate an existing record.
     *
     * @param int $saleId
     * @return array
     */
    public function calculateForSale(int $saleId): array
    {
        $sale = DB::table('sales')->where('sale_id', $saleId)->first();

        if (! $sale) {
            return ['status' => 'not_found', 'message' => 'Sale not found.'];
        }

        // Only completed sales earn commission. Matches the casing used
        // in SaleController::stats() ('Completed', 'Pending', etc).
        if ($sale->status !== 'Completed') {
            return [
                'status' => 'skipped',
                'message' => "Sale status is '{$sale->status}', not 'Completed'. No commission generated.",
            ];
        }

        // Already calculated for this sale — don't create a duplicate
        $existing = DB::table('commissions')->where('sale_id', $saleId)->first();
        if ($existing) {
            return [
                'status' => 'already_exists',
                'commission_id' => $existing->commission_id,
                'commission_amount' => (float) $existing->commission_amount,
            ];
        }

        // FIX: users table's primary key is `user_id`, not `id`
        $user = DB::table('users')->where('user_id', $sale->user_id)->first();

        if (! $user) {
            return ['status' => 'error', 'message' => 'Seller (user) not found for this sale.'];
        }

        $rate = (float) ($user->commission_rate ?? 0);
        $saleAmount = (float) $sale->total_amount;
        $commissionAmount = round($saleAmount * ($rate / 100), 2);

        if ($rate <= 0) {
            \Log::warning("Sale #{$saleId}: seller (user_id={$user->user_id}) has commission_rate=0. Commission will be $0.00.");
        }

        $commissionId = DB::table('commissions')->insertGetId([
            'sale_id' => $saleId,
            'user_id' => $user->user_id,
            'sale_amount' => $saleAmount,
            'commission_rate' => $rate,
            'commission_amount' => $commissionAmount,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'commission_id');

        return [
            'status' => 'ok',
            'commission_id' => $commissionId,
            'sale_id' => $saleId,
            'user_id' => $user->user_id, // FIX: was $user->id
            'sale_amount' => $saleAmount,
            'commission_rate' => $rate,
            'commission_amount' => $commissionAmount,
        ];
    }

    /**
     * Total commissions earned by a seller within a date range
     * (e.g. for a monthly payout report).
     *
     * @param int $userId
     * @param string $startDate  'Y-m-d'
     * @param string $endDate    'Y-m-d'
     */
    public function totalForSeller(int $userId, string $startDate, string $endDate): array
    {
        // Extend the end boundary to the last moment of that day —
        // otherwise a plain 'Y-m-d' end date is treated as midnight
        // and excludes every commission created later that same day.
        $rangeEnd = \Illuminate\Support\Carbon::parse($endDate)->endOfDay();

        $rows = DB::table('commissions')
            ->where('user_id', $userId)
            ->whereBetween('created_at', [$startDate, $rangeEnd])
            ->get();

        return [
            'user_id' => $userId,
            'period' => ['from' => $startDate, 'to' => $endDate],
            'sales_count' => $rows->count(),
            'total_sale_amount' => round($rows->sum('sale_amount'), 2),
            'total_commission' => round($rows->sum('commission_amount'), 2),
        ];
    }

    /**
     * Commission summary for every seller within a date range —
     * useful for an end-of-month payout dashboard.
     */
    public function summaryForAllSellers(string $startDate, string $endDate): array
    {
        // Same end-of-day fix as totalForSeller() — a bare 'Y-m-d' end
        // date is midnight, which excludes commissions created later
        // that same day.
        $rangeEnd = \Illuminate\Support\Carbon::parse($endDate)->endOfDay();

        $rows = DB::table('commissions')
            ->join('users', 'users.user_id', '=', 'commissions.user_id')
            ->whereBetween('commissions.created_at', [$startDate, $rangeEnd])
            ->selectRaw('
                commissions.user_id,
                users.name as user_name,
                COUNT(*) as sales_count,
                SUM(commissions.sale_amount) as total_sale_amount,
                SUM(commissions.commission_amount) as total_commission
            ')
            ->groupBy('commissions.user_id', 'users.name')
            ->orderByDesc('total_commission')
            ->get();

        // Oracle's OCI driver often returns COUNT()/SUM() results as
        // strings rather than native PHP numbers. The frontend's number
        // formatter only renders strict `typeof === 'number'` values
        // (falling back to "—" otherwise), so cast explicitly here —
        // this is what was causing "Sales count" to show "—" even
        // though the underlying data was correct.
        return $rows->map(function ($row) {
            $row->user_id = (int) $row->user_id;
            $row->sales_count = (int) $row->sales_count;
            $row->total_sale_amount = round((float) $row->total_sale_amount, 2);
            $row->total_commission = round((float) $row->total_commission, 2);
            return $row;
        })->toArray();
    }
}
