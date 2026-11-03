<?php

namespace App\Console\Commands;

use App\Services\Accounting\AccountingSyncService;
use Illuminate\Console\Command;

class SyncAccountingCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'victory:sync-accounting';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize real production transactions (invoices, payments, purchasings, costing) into the Accounting system';

    /**
     * Execute the console command.
     */
    public function handle(AccountingSyncService $syncService): int
    {
        $this->info('Starting Accounting Synchronization...');

        $results = $syncService->syncAll();

        $this->table(
            ['Entity', 'Synced Count'],
            [
                ['Invoices', $results['invoices']],
                ['Payments', $results['payments']],
                ['Purchasings / Vendor Bills', $results['purchasings']],
                ['Job Order Costings', $results['costing']],
            ]
        );

        $this->info('Accounting Synchronization Completed successfully!');

        return Command::SUCCESS;
    }
}
