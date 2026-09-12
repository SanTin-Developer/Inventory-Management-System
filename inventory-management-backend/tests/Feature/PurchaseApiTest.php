<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchaseApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        $role = Role::create(['role_name' => 'Admin', 'description' => 'Admin']);

        return User::factory()->create(['email' => 'admin@example.com', 'role_id' => $role->role_id]);
    }

    private function makeSupplier(): Supplier
    {
        return Supplier::create([
            'supplier_name' => 'Acme Supplies',
            'supplier_code' => 'SUP-1',
        ]);
    }

    private function makeProduct(): Product
    {
        return Product::create([
            'product_name' => 'Widget',
            'product_code' => 'PD-20001',
            'unit_price' => 12,
            'cost_price' => 8,
            'quantity_in_stock' => 100,
            'reorder_level' => 10,
        ]);
    }

    public function test_admin_can_create_a_purchase_with_line_items(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
            'status' => 'Received',
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 10, 'unit_cost' => 8],
                ['product_id' => $product->product_id, 'quantity' => 5, 'unit_cost' => 7],
            ],
        ])->assertCreated();

        $purchaseId = $response->json('data.purchase_id');
        $this->assertStringStartsWith('PC-', $response->json('data.purchase_code'));
        $this->assertDatabaseHas('purchase_details', [
            'purchase_id' => $purchaseId,
            'product_id' => $product->product_id,
            'quantity' => 10,
            'subtotal' => 80.00,
        ]);
    }

    public function test_purchase_details_are_summed_correctly(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-02',
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 10, 'unit_cost' => 8],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('purchase_details', [
            'purchase_id' => $response->json('data.purchase_id'),
            'subtotal' => 80.00,
        ]);
    }

    public function test_purchase_list_is_paginated(): void
    {
        $admin = $this->makeAdmin();
        Sanctum::actingAs($admin, ['*']);

        $this->getJson('/api/purchases')->assertOk()
            ->assertJsonStructure([
                'current_page', 'data', 'first_page_url', 'total',
            ]);
    }

    public function test_purchase_update_can_replace_line_items(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $purchase = Purchase::create([
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
        ]);

        $this->putJson("/api/purchases/{$purchase->purchase_id}", [
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'status' => 'Received',
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 3, 'unit_cost' => 9],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('purchase_details', [
            'purchase_id' => $purchase->purchase_id,
            'quantity' => 3,
            'subtotal' => 27.00,
        ]);
    }

    public function test_received_purchase_increments_stock(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
            'status' => 'Received',
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 10, 'unit_cost' => 8],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('products', [
            'product_id' => $product->product_id,
            'quantity_in_stock' => 110,
        ]);
    }

    public function test_pending_purchase_does_not_change_stock(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
            'status' => 'Pending',
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 10, 'unit_cost' => 8],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('products', [
            'product_id' => $product->product_id,
            'quantity_in_stock' => 100,
        ]);
    }

    public function test_cancelling_a_received_purchase_returns_stock(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $purchase = Purchase::create([
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
            'status' => 'Received',
        ]);
        PurchaseDetail::create([
            'purchase_id' => $purchase->purchase_id,
            'product_id' => $product->product_id,
            'quantity' => 10,
            'unit_cost' => 8,
            'subtotal' => 80,
        ]);
        $product->increment('quantity_in_stock', 10);
        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 110]);

        $this->putJson("/api/purchases/{$purchase->purchase_id}", [
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'status' => 'Cancelled',
        ])->assertOk();

        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 100]);
    }

    public function test_deleting_a_received_purchase_returns_stock(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $purchase = Purchase::create([
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
            'status' => 'Received',
        ]);
        PurchaseDetail::create([
            'purchase_id' => $purchase->purchase_id,
            'product_id' => $product->product_id,
            'quantity' => 10,
            'unit_cost' => 8,
            'subtotal' => 80,
        ]);
        $product->increment('quantity_in_stock', 10);

        $this->deleteJson("/api/purchases/{$purchase->purchase_id}")->assertOk();

        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 100]);
    }

    public function test_updating_received_purchase_details_reconciles_stock(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        $product = $this->makeProduct();
        Sanctum::actingAs($admin, ['*']);

        $purchase = Purchase::create([
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
            'status' => 'Received',
        ]);
        PurchaseDetail::create([
            'purchase_id' => $purchase->purchase_id,
            'product_id' => $product->product_id,
            'quantity' => 10,
            'unit_cost' => 8,
            'subtotal' => 80,
        ]);
        $product->increment('quantity_in_stock', 10);

        // 10 received (stock 110) -> 4 received (stock 104)
        $this->putJson("/api/purchases/{$purchase->purchase_id}", [
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'status' => 'Received',
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 4, 'unit_cost' => 8],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 104]);
    }

    public function test_purchase_delete_removes_the_record(): void
    {
        $admin = $this->makeAdmin();
        $supplier = $this->makeSupplier();
        Sanctum::actingAs($admin, ['*']);

        $purchase = Purchase::create([
            'supplier_id' => $supplier->supplier_id,
            'user_id' => $admin->user_id,
            'purchase_date' => '2026-09-01',
        ]);

        $this->deleteJson("/api/purchases/{$purchase->purchase_id}")->assertOk();
        $this->assertDatabaseMissing('purchases', ['purchase_id' => $purchase->purchase_id]);
    }
}
