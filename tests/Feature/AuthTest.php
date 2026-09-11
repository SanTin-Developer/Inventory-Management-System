<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset rate-limit buckets between tests (throttle:5,1 on public
        // routes keys on the caller's IP, which is 127.0.0.1 in the test env).
        Cache::flush();
    }

    private function makeAdmin(): User
    {
        $role = Role::create([
            'role_name' => 'Admin',
            'description' => 'System administrator',
        ]);

        return User::factory()->create([
            'email' => 'admin@example.com',
            'role_id' => $role->role_id,
            'commission_rate' => 5,
        ]);
    }

    public function test_admin_can_log_in_with_valid_credentials(): void
    {
        $admin = $this->makeAdmin();

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.email', $admin->email);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->makeAdmin();

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Invalid credentials.']);
    }

    public function test_login_does_not_reveal_unknown_emails(): void
    {
        $this->postJson('/api/login', [
            'email' => 'nobody@example.com',
            'password' => 'password',
        ])
            ->assertUnauthorized()
            ->assertJsonFragment(['message' => 'Invalid credentials.']);
    }

    public function test_login_blocks_inactive_account(): void
    {
        $this->makeAdmin();

        User::where('email', 'admin@example.com')->update(['status' => 'Inactive']);

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertStatus(403);
    }

    public function test_login_requests_2fa_verification_when_enabled(): void
    {
        $this->makeAdmin();

        User::where('email', 'admin@example.com')->update([
            'two_factor_enabled' => true,
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('requires_2fa', true);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $admin = $this->makeAdmin();
        Sanctum::actingAs($admin, ['*']);

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('role.role_name', 'Admin');
    }

    public function test_my_permissions_returns_role_matrix(): void
    {
        $admin = $this->makeAdmin();
        Sanctum::actingAs($admin, ['*']);

        $this->getJson('/api/my-permissions')
            ->assertOk()
            ->assertJsonPath('products', 'full')
            ->assertJsonPath('audit-logs', 'view');
    }

    public function test_logout_revokes_the_token(): void
    {
        $this->makeAdmin();

        $login = $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertOk();

        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/user')->assertOk();
        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Simulate a fresh request lifecycle (production boots a new kernel per
        // request) so Sanctum re-resolves the guard against the deleted token.
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_forgot_password_never_reveals_registered_emails(): void
    {
        $this->makeAdmin();

        $this->postJson('/api/forgot-password', ['email' => 'admin@example.com'])
            ->assertOk()
            ->assertJsonFragment(['message' => 'If an account exists for that email, a reset link has been sent.']);

        $this->postJson('/api/forgot-password', ['email' => 'not-registered@example.com'])
            ->assertOk()
            ->assertJsonFragment(['message' => 'If an account exists for that email, a reset link has been sent.']);
    }

    public function test_reset_password_with_invalid_token_fails(): void
    {
        $this->makeAdmin();

        $this->postJson('/api/reset-password', [
            'email' => 'admin@example.com',
            'token' => 'invalid-token',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertStatus(422);
    }

    public function test_security_headers_are_present(): void
    {
        $this->makeAdmin();

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
