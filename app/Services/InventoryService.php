<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;
use RuntimeException;
use Throwable;

/**
 * InventoryService — the single place that moves stock. Purchase receipts
 * increase it, completed sales decrease it, and both are reversible so a
 * cancelled/deleted document puts stock back exactly as it was.
 *
 * The PostgreSQL trigger trg_prevent_negative_stock is a safety net at the
 * DB level; this service performs an explicit, user-friendly check first so
 * the API can reject an oversell cleanly and atomically.
 */
class InventoryService
{
    /**
     * Increase stock for a received purchase.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $details
     */
    public function receive(array $details): void
    {
        $this->apply($details, 1);
    }

    /**
     * Decrease stock again when a received purchase is cancelled/deleted.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $details
     */
    public function reverseReceipt(array $details): void
    {
        $this->apply($details, -1);
    }

    /**
     * Decrease stock for a completed sale, refusing to oversell.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $details
     *
     * @throws RuntimeException when any product has insufficient stock
     */
    public function ship(array $details): void
    {
        $this->assertSufficientStock($details);
        $this->apply($details, -1);
    }

    /**
     * Return stock when a completed sale is cancelled, refunded or deleted.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $details
     */
    public function returnStock(array $details): void
    {
        $this->apply($details, 1);
    }

    /**
     * Aggregate line items per product so multi-line documents are consistent.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $details
     */
    private function demandPerProduct(array $details): Collection
    {
        return collect($details)
            ->groupBy('product_id')
            ->map(fn (Collection $lines) => (int) $lines->sum('quantity'));
    }

    /**
     * @param  array<int, array{product_id: int, quantity: int}>  $details
     */
    private function assertSufficientStock(array $details): void
    {
        $demands = $this->demandPerProduct($details);

        $products = Product::whereIn('product_id', $demands->keys())->get()->keyBy('product_id');

        foreach ($demands as $productId => $quantity) {
            $available = (int) ($products[$productId]->quantity_in_stock ?? 0);

            if ($available < $quantity) {
                // Message matches trg_prevent_negative_stock so the friendly
                // error mapper yields the same user-facing copy.
                throw new RuntimeException('Stock cannot be negative');
            }
        }
    }

    /**
     * Apply a signed quantity delta to each product's stock. Throws on any
     * DB failure so the caller's transaction rolls back atomically.
     *
     * @param  array<int, array{product_id: int, quantity: int}>  $details
     */
    private function apply(array $details, int $direction): void
    {
        foreach ($this->demandPerProduct($details) as $productId => $quantity) {
            try {
                Product::whereKey($productId)->increment('quantity_in_stock', $direction * $quantity);
            } catch (Throwable $e) {
                throw new RuntimeException('Unable to update stock: '.$e->getMessage(), 0, $e);
            }
        }
    }
}
