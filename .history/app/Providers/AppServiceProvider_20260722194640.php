<?php

namespace App\Providers;

use App\Models\AuditLog;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Event;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;


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

        // TEMPORARY — remove after debugging the email-change update issue.
        // Logs every SQL query + bindings to storage/logs/laravel.log
        if (! $this->app->isProduction()) {
            DB::listen(function ($query) {
                \Log::info('[SQL] ' . $query->sql, $query->bindings);
            });
        }

        Event::listen(Login::class, function (Login $event) {
            AuditLog::create([
                'user_id'        => $event->user->user_id,
                'event'          => 'login',
                'auditable_type' => \App\Models\User::class,
                'auditable_id'   => $event->user->user_id,
                'ip_address'     => request()?->ip(),
                'created_at'     => now(),
            ]);
        });

        Event::listen(Logout::class, function (Logout $event) {
            AuditLog::create([
                'user_id'        => $event->user?->user_id,
                'event'          => 'logout',
                'auditable_type' => \App\Models\User::class,
                'auditable_id'   => $event->user?->user_id,
                'ip_address'     => request()?->ip(),
                'created_at'     => now(),
            ]);
        });

        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return "{$frontendUrl}/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
