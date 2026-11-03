<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Stage 2: Scheduled Accounting & KPI Background Automation
Schedule::command('victory:sync-accounting')->hourly()->withoutOverlapping();
Schedule::command('victory:calculate-kpi')->dailyAt('00:05')->withoutOverlapping();
