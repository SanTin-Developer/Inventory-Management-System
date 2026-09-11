<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SaleApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeSeller(float $rate = 5): User
    {
        $role = Role::create(['role_name' => 'Cashier', 'description' => 'Cashier']);

        return User::factory()->create([
            'email' => 'cashier@example.com',
            'role_id' => $role->role_id,
            'commission_rate' => $rate,
        ]);
    }

    private function makeProduct(): Product
    {
        return Product::create([
            'product_name' => 'Widget',
            'product_code' => 'PD-30001',
            'unit_price' => 12,
            'cost_price' => 8,
            'quantity_in_stock' => 100,
            'reorder_level' => 10,
        ]);
    }

    public function test_sale_total_is_computed_from_line_items_and_discount(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();
        Sanctum::actingAs($seller, ['*']);

        $response = $this->postJson('/api/sales', [
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'payment_method' => 'Cash',
            'status' => 'Completed',
            'discount_amount' => 50,
            'total_amount' => 999, // client-supplied value must be ignored
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 10, 'unit_price' => 15],
                ['product_id' => $product->product_id, 'quantity' => 2, 'unit_price' => 20],
            ],
        ])->assertCreated();

        $saleId = $response->json('data.sale_id');
        $this->assertStringStartsWith('SL-', $response->json('data.sale_code'));
        $this->assertDatabaseHas('sales', [
            'sale_id' => $saleId,
            // (10*15 + 2*20) = 190 - 50 discount = 140
            'total_amount' => 140.00,
        ]);
        $this->assertDatabaseHas('sale_details', [
            'sale_id' => $saleId,
            'quantity' => 10,
            'subtotal' => 150.00,
        ]);
    }

    public function test_completed_sale_generates_commission(): void
    {
        $seller = $this->makeSeller(5);
        $product = $this->makeProduct();
        Sanctum::actingAs($seller, ['*']);

        $response = $this->postJson('/api/sales', [
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Completed',
            'total_amount' => 100,
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 10, 'unit_price' => 12],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('commissions', [
            'sale_id' => $response->json('data.sale_id'),
            'user_id' => $seller->user_id,
            'commission_rate' => 5.00,
            // 120 * 5% = 6
            'commission_amount' => 6.00,
        ]);
    }

    public function test_pending_sale_does_not_generate_commission(): void
    {
        $seller = $this->makeSeller(5);
        $product = $this->makeProduct();
        Sanctum::actingAs($seller, ['*']);

        $response = $this->postJson('/api/sales', [
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Cancelled',
            'total_amount' => 100,
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 10, 'unit_price' => 12],
            ],
        ])->assertCreated();

        $this->assertDatabaseMissing('commissions', [
            'sale_id' => $response->json('data.sale_id'),
        ]);
    }

    public function test_sale_update_can_replace_line_items(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();

        $sale = Sale::create([
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'total_amount' => 0,
        ]);

        Sanctum::actingAs($seller, ['*']);

        $this->putJson("/api/sales/{$sale->sale_id}", [
            'user_id' => $seller->user_id,
            'status' => 'Completed',
            'discount_amount' => 0,
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 5, 'unit_price' => 10],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('sale_details', [
            'sale_id' => $sale->sale_id,
            'quantity' => 5,
            'subtotal' => 50.00,
        ]);
    }

    public function test_completed_sale_decrements_stock(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();
        Sanctum::actingAs($seller, ['*']);

        $this->postJson('/api/sales', [
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Completed',
            'total_amount' => 80,
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 8, 'unit_price' => 10],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('products', [
            'product_id' => $product->product_id,
            'quantity_in_stock' => 92,
        ]);
    }

    public function test_cancelled_sale_does_not_change_stock(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();
        Sanctum::actingAs($seller, ['*']);

        $this->postJson('/api/sales', [
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Cancelled',
            'total_amount' => 80,
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 8, 'unit_price' => 10],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('products', [
            'product_id' => $product->product_id,
            'quantity_in_stock' => 100,
        ]);
    }

    public function test_overselling_is_rejected_atomically(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();
        Sanctum::actingAs($seller, ['*']);

        $response = $this->postJson('/api/sales', [
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Completed',
            'total_amount' => 10000,
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 1000, 'unit_price' => 10],
            ],
        ]);

        $response->assertStatus(500);
        $this->assertTrue(str_contains($response->json('message'), 'stock'));

        $this->assertDatabaseMissing('sales', ['user_id' => $seller->user_id]);
        $this->assertDatabaseHas('products', [
            'product_id' => $product->product_id,
            'quantity_in_stock' => 100,
        ]);
    }

    public function test_cancelling_a_completed_sale_returns_stock(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();
        Sanctum::actingAs($seller, ['*']);

        $sale = Sale::create([
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Completed',
            'total_amount' => 80,
        ]);
        SaleDetail::create([
            'sale_id' => $sale->sale_id,
            'product_id' => $product->product_id,
            'quantity' => 8,
            'unit_price' => 10,
            'subtotal' => 80,
        ]);
        $product->decrement('quantity_in_stock', 8);
        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 92]);

        $this->putJson("/api/sales/{$sale->sale_id}", [
            'user_id' => $seller->user_id,
            'status' => 'Cancelled',
        ])->assertOk();

        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 100]);
    }

    public function test_deleting_a_completed_sale_returns_stock(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();

        $sale = Sale::create([
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Completed',
            'total_amount' => 80,
        ]);
        SaleDetail::create([
            'sale_id' => $sale->sale_id,
            'product_id' => $product->product_id,
            'quantity' => 8,
            'unit_price' => 10,
            'subtotal' => 80,
        ]);
        $product->decrement('quantity_in_stock', 8);

        Sanctum::actingAs($seller, ['*']);

        $this->deleteJson("/api/sales/{$sale->sale_id}")->assertOk();

        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 100]);
        $this->assertDatabaseMissing('sale_details', ['sale_id' => $sale->sale_id]);
    }

    public function test_updating_completed_sale_details_reconciles_stock(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();

        $sale = Sale::create([
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'status' => 'Completed',
            'total_amount' => 80,
        ]);
        SaleDetail::create([
            'sale_id' => $sale->sale_id,
            'product_id' => $product->product_id,
            'quantity' => 8,
            'unit_price' => 10,
            'subtotal' => 80,
        ]);
        $product->decrement('quantity_in_stock', 8);

        Sanctum::actingAs($seller, ['*']);

        // 8 sold (stock 92) -> 2 sold (stock 98)
        $this->putJson("/api/sales/{$sale->sale_id}", [
            'user_id' => $seller->user_id,
            'status' => 'Completed',
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 2, 'unit_price' => 10],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('products', ['product_id' => $product->product_id, 'quantity_in_stock' => 98]);
    }

    public function test_sale_delete_cascades_to_details(): void
    {
        $seller = $this->makeSeller();
        $product = $this->makeProduct();

        $sale = Sale::create([
            'user_id' => $seller->user_id,
            'sale_date' => '2026-09-01',
            'total_amount' => 120,
        ]);
        DB::table('sale_details')->insert([
            'sale_id' => $sale->sale_id,
            'product_id' => $product->product_id,
            'quantity' => 10,
            'unit_price' => 12,
            'subtotal' => 120,
        ]);

        Sanctum::actingAs($seller, ['*']);

        $this->deleteJson("/api/sales/{$sale->sale_id}")->assertOk();
        $this->assertDatabaseMissing('sale_details', ['sale_id' => $sale->sale_id]);
    }

    public function test_unauthorized_role_cannot_create_sales(): void
    {
        $role = Role::create(['role_name' => 'Delivery Driver', 'description' => 'Driver']);
        $driver = User::factory()->create(['email' => 'driver@example.com', 'role_id' => $role->role_id]);
        $product = $this->makeProduct();

        Sanctum::actingAs($driver, ['*']);

        $this->postJson('/api/sales', [
            'user_id' => $driver->user_id,
            'sale_date' => '2026-09-01',
            'total_amount' => 10,
            'details' => [
                ['product_id' => $product->product_id, 'quantity' => 1, 'unit_price' => 10],
            ],
        ])->assertForbidden();
    }
}
