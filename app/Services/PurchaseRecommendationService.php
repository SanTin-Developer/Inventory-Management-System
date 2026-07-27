<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * PurchaseRecommendationService
 *
 * Calculates how many units of each product should be purchased,
 * based on historical sales data (sales + sale_details), demand
 * variability, and supplier lead time. Uses Reorder Point (ROP) +
 * Economic Order Quantity (EOQ).
 *
 * Schema notes (Oracle):
 *   products(product_id PK, product_name, quantity_in_stock, reorder_level,
 *            lead_time_days, order_cost, holding_cost, ...)
 *   sales(sale_id PK, sale_date, status, ...)
 *   sale_details(sale_detail_id PK, sale_id, product_id, quantity, ...)
 */
class PurchaseRecommendationService
{
    // Z-score for a 95% service level (probability of not stocking out)
    private const Z_SCORE_95 = 1.65;

    /**
     * Analyze a single product and return a purchase recommendation.
     *
     * @param int $productId
     * @param int $lookbackDays  How many days of sales history to analyze
     * @return array
     */
    public function analyzeProduct(int $productId, int $lookbackDays = 90): array
    {
        $product = DB::table('products')
            ->where('product_id', $productId)
            ->first();

        if (! $product) {
            return [
                'product_id' => $productId,
                'status' => 'not_found',
                'message' => 'Product not found.',
            ];
        }

        // 1. Pull daily sales quantities for the lookback period.
        // Only count completed sales, if a status column is being used that way.
        $dailySales = DB::table('sale_details')
            ->join('sales', 'sales.sale_id', '=', 'sale_details.sale_id')
            ->where('sale_details.product_id', $productId)
            ->where('sales.sale_date', '>=', now()->subDays($lookbackDays))
            ->selectRaw('TRUNC(sales.sale_date) as sale_day, SUM(sale_details.quantity) as qty')
            ->groupBy(DB::raw('TRUNC(sales.sale_date)'))
            ->pluck('qty')
            ->map(fn($q) => (float) $q)
            ->toArray();

        // If there's no sales history, we can't forecast — flag it
        if (count($dailySales) === 0) {
            return [
                'product_id' => $productId,
                'product_name' => $product->product_name,
                'status' => 'no_data',
                'message' => 'Not enough sales history to generate a recommendation.',
            ];
        }

        // 2. Fill in zero-sale days so the average/std-dev reflect true demand
        $filledSales = $this->fillMissingDays($dailySales, $lookbackDays);

        $avgDailyDemand = $this->average($filledSales);
        $stdDevDemand = $this->standardDeviation($filledSales, $avgDailyDemand);

        // 3. Supplier lead time and cost assumptions — from the products table
        $leadTimeDays = $product->lead_time_days ?? 7;
        $orderCost = $product->order_cost ?? 10.0;        // cost to place one purchase order
        $holdingCostPerUnit = $product->holding_cost ?? 1.0; // cost to hold 1 unit/year

        // 4. Safety stock — buffer against demand variability during lead time
        $safetyStock = self::Z_SCORE_95 * $stdDevDemand * sqrt($leadTimeDays);

        // 5. Reorder point — stock level that should trigger a new purchase
        $reorderPoint = ($avgDailyDemand * $leadTimeDays) + $safetyStock;

        // 6. Economic Order Quantity — optimal purchase batch size
        $annualDemand = $avgDailyDemand * 365;
        $eoq = $annualDemand > 0 && $holdingCostPerUnit > 0
            ? sqrt((2 * $annualDemand * $orderCost) / $holdingCostPerUnit)
            : 0;

        $currentStock = $product->quantity_in_stock ?? 0;
        $needsReorderNow = $currentStock <= $reorderPoint;

        return [
            'product_id' => $productId,
            'product_name' => $product->product_name,
            'status' => 'ok',
            'current_stock' => $currentStock,
            'reorder_level_configured' => $product->reorder_level ?? null,
            'avg_daily_demand' => round($avgDailyDemand, 2),
            'demand_std_dev' => round($stdDevDemand, 2),
            'lead_time_days' => $leadTimeDays,
            'reorder_point' => round($reorderPoint),
            'recommended_order_qty' => round($eoq),
            'needs_reorder_now' => $needsReorderNow,
            'message' => $needsReorderNow
                ? "Reorder now: purchase approximately {$this->round($eoq)} units."
                : "Stock is sufficient for now. Reorder when stock drops to {$this->round($reorderPoint)} units.",
        ];
    }

    /**
     * Run analysis across all products (e.g. for a dashboard or nightly job).
     */
    public function analyzeAllProducts(int $lookbackDays = 90): array
    {
        return DB::table('products')
            ->pluck('product_id')
            ->map(fn($id) => $this->analyzeProduct((int) $id, $lookbackDays))
            ->toArray();
    }

    /**
     * Fill days with no sales as 0, so averages/std-dev reflect true demand
     * (otherwise slow-moving products look artificially high-demand).
     */
    private function fillMissingDays(array $salesByDay, int $totalDays): array
    {
        $filled = $salesByDay;
        $missingDays = $totalDays - count($salesByDay);

        for ($i = 0; $i < $missingDays; $i++) {
            $filled[] = 0.0;
        }

        return $filled;
    }

    private function average(array $values): float
    {
        return count($values) > 0 ? array_sum($values) / count($values) : 0.0;
    }

    private function standardDeviation(array $values, float $mean): float
    {
        $count = count($values);
        if ($count === 0) {
            return 0.0;
        }

        $variance = array_sum(array_map(fn($v) => ($v - $mean) ** 2, $values)) / $count;

        return sqrt($variance);
    }

    private function round(float $value): int
    {
        return (int) round($value);
    }
}
