<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        $role = Role::create(['role_name' => 'Admin', 'description' => 'Admin']);

        return User::factory()->create(['email' => 'admin@example.com', 'role_id' => $role->role_id]);
    }

    private function makeAuditor(): User
    {
        $role = Role::create(['role_name' => 'Auditor', 'description' => 'Auditor']);

        return User::factory()->create(['email' => 'auditor@example.com', 'role_id' => $role->role_id]);
    }

    private function makeCategory(): Category
    {
        return Category::create(['category_name' => 'Electronics', 'category_code' => 'CAT-100']);
    }

    private function makeProduct(Category $category, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'category_id' => $category->category_id,
            'product_name' => 'Wireless Mouse',
            'product_code' => 'PD-10001',
            'unit_price' => 25.00,
            'cost_price' => 15.00,
            'quantity_in_stock' => 50,
            'reorder_level' => 10,
            'unit' => 'pcs',
        ], $overrides));
    }

    public function test_admin_can_create_a_product(): void
    {
        $admin = $this->makeAdmin();
        $category = $this->makeCategory();

        Sanctum::actingAs($admin, ['*']);

        $this->postJson('/api/products', [
            'product_name' => 'Keyboard',
            'unit_price' => 45,
            'cost_price' => 30,
            'quantity_in_stock' => 20,
            'reorder_level' => 5,
            'category_id' => $category->category_id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.product_name', 'Keyboard')
            ->assertJsonPath('data.quantity_in_stock', 20);
    }

    public function test_product_code_is_generated_when_omitted(): void
    {
        $admin = $this->makeAdmin();
        $category = $this->makeCategory();
        Sanctum::actingAs($admin, ['*']);

        $this->postJson('/api/products', [
            'product_name' => 'Speaker',
            'unit_price' => 60,
            'cost_price' => 40,
            'category_id' => $category->category_id,
        ])->assertCreated();

        $this->assertStringStartsWith('PD-', Product::where('product_name', 'Speaker')->first()->product_code);
    }

    public function test_admin_can_search_products_by_name(): void
    {
        $admin = $this->makeAdmin();
        $category = $this->makeCategory();
        $this->makeProduct($category, ['product_name' => 'Wireless Mouse']);
        $this->makeProduct($category, ['product_name' => 'Speaker', 'product_code' => 'PD-10002']);

        Sanctum::actingAs($admin, ['*']);

        $this->getJson('/api/products?search=mouse&per_page=10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product_name', 'Wireless Mouse');
    }

    public function test_admin_can_update_a_product(): void
    {
        $admin = $this->makeAdmin();
        $category = $this->makeCategory();
        $product = $this->makeProduct($category);

        Sanctum::actingAs($admin, ['*']);

        $this->putJson("/api/products/{$product->product_id}", [
            'category_id' => $category->category_id,
            'product_name' => $product->product_name,
            'product_code' => $product->product_code,
            'unit_price' => 33,
            'cost_price' => $product->cost_price,
        ])
            ->assertOk()
            ->assertJsonPath('data.unit_price', 33);
    }

    public function test_admin_can_delete_an_unreferenced_product(): void
    {
        $admin = $this->makeAdmin();
        $category = $this->makeCategory();
        $product = $this->makeProduct($category);

        Sanctum::actingAs($admin, ['*']);

        $this->deleteJson("/api/products/{$product->product_id}")->assertOk();

        $this->assertDatabaseMissing('products', ['product_id' => $product->product_id]);
    }

    public function test_read_only_role_cannot_create_products(): void
    {
        $auditor = $this->makeAuditor();
        $category = $this->makeCategory();
        Sanctum::actingAs($auditor, ['*']);

        $this->getJson('/api/products')->assertOk();

        $this->postJson('/api/products', [
            'product_name' => 'Nope',
            'unit_price' => 5,
            'cost_price' => 2,
            'category_id' => $category->category_id,
        ])->assertForbidden();
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/products')->assertUnauthorized();
    }
}
