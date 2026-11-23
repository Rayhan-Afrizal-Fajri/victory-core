<?php

use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;
use App\Providers\ImpersonationServiceProvider;

return [
    AppServiceProvider::class,
    FortifyServiceProvider::class,
    ImpersonationServiceProvider::class,
];
