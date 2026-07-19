<?php

namespace App\Providers;

use App\Models\AuditLog;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
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
        Event::listen(Login::class, function (Login $event) {
            AuditLog::create([
                'user_id'    => $event->user->user_id,
                'event'      => 'login',
                'ip_address' => request()?->ip(),
                'created_at' => now(),
            ]);
        });

        Event::listen(Logout::class, function (Logout $event) {
            AuditLog::create([
                'user_id'    => $event->user?->user_id,
                'event'      => 'logout',
                'ip_address' => request()?->ip(),
                'created_at' => now(),
            ]);
        });
    }
}
