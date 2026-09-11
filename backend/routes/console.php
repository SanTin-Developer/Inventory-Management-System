<?php

use App\Models\PendingEmailChange;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Clean up expired email-change confirmation tokens daily.
Schedule::call(function () {
    PendingEmailChange::where('expires_at', '<', now())->delete();
})->name('cleanup-expired-email-changes')->daily();
