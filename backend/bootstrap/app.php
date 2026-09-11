<?php

use App\Http\Middleware\CanManageSalaryRanges;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'can-manage-salary-ranges' => CanManageSalaryRanges::class,
            'permission' => CheckPermission::class,
        ]);

        // Baseline security headers on every response.
        $middleware->append(SecurityHeaders::class);

        // Never redirect unauthenticated requests — this is API-only,
        // there is no 'login' web route to redirect to.
        $middleware->redirectGuestsTo(fn (Request $request) => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
