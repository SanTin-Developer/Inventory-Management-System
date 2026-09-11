<?php

namespace App\Providers;

use App\Mail\Transport\BrevoApiTransport;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        Mail::extend('brevo', function (array $config) {
            return new BrevoApiTransport((string) config('services.brevo.key'));
        });

        // Global API rate limit — 60 requests/minute per user (or per IP for
        // unauthenticated callers). Applied via ->middleware('throttle:api').
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->getAuthIdentifier() ?? $request->ip());
        });

        Event::listen(Login::class, function (Login $event) {
            AuditLog::create([
                'user_id' => $event->user->user_id,
                'event' => 'login',
                'auditable_type' => User::class,
                'auditable_id' => $event->user->user_id,
                'ip_address' => request()?->ip(),
                'created_at' => now(),
            ]);
        });

        Event::listen(Logout::class, function (Logout $event) {
            AuditLog::create([
                'user_id' => $event->user?->user_id,
                'event' => 'logout',
                'auditable_type' => User::class,
                'auditable_id' => $event->user?->user_id,
                'ip_address' => request()?->ip(),
                'created_at' => now(),
            ]);
        });

        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

            return "{$frontendUrl}/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
