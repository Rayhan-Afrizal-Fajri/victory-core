<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'dashboard.admin',
            'kanban_board.view',
            'worker_board.view',

            'order_entry.create',
            'order_entry.update',

            'invoice_payments.view',

            'purchasing.view',
            'job_tickets.view',

            'reports.view',

            'master_data',

            //job-ticket process
            'design.upload',
            'design.approve',
            'design.sync_article',
            'design.manage_specs',
            'design.set_selling_price',

            'quotation.generate',
            'quotation.approve',
            'quotation.print',

            'invoice.view',
            'invoice.print',

            'payment.create',
            'payment.update',
            'payment.delete',
            'payment.verify',
            'payment.reject',

            'purchasing.generate_bom',
            'purchasing.create',
            'purchasing.update',
            'purchasing.delete',
            'purchasing.mark_ordered',
            'purchasing.receive',

            'production.process',
            'production.qc',
            'production.packing',
            'production.delivery',

            'sample.approve',
            'sample.revision',
            'sample.reject',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            'Owner',
            'Customer Service',
            'Designer',
            'Finance',
            'PPIC',
            'Produksi',
            'Customer',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        Role::findByName('Owner')->syncPermissions($permissions);

        Role::findByName('Designer')->syncPermissions([
            'design.upload',
            'design.sync_article',
            'design.manage_specs',
        ]);

        Role::findByName('Finance')->syncPermissions([
            'invoice.view',
            'invoice.print',
            'payment.verify',
            'payment.reject',
        ]);

        Role::findByName('Customer Service')->syncPermissions([
            'invoice.view',
            'payment.create',
            'payment.update',
            'payment.delete',
            'sample.approve',
            'sample.revision',
            'sample.reject',
        ]);

        Role::findByName('PPIC')->syncPermissions([
            'purchasing.generate_bom',
            'purchasing.create',
            'purchasing.update',
            'purchasing.delete',
            'purchasing.mark_ordered',
            'purchasing.receive',
        ]);

        Role::findByName('Produksi')->syncPermissions([
            'production.process',
            'production.qc',
            'production.packing',
            'production.delivery',
        ]);

        Role::findByName('Customer')->syncPermissions([
            'order_entry.create',
            'job_tickets.view'
        ]);

        $users = [
            [
                'name' => 'Owner Victory',
                'email' => 'owner@victorylabs.id',
                'role' => 'Owner',
            ],
            [
                'name' => 'Admin Victory',
                'email' => 'admin@victorylabs.id',
                'role' => 'Owner',
            ],
            [
                'name' => 'CS User',
                'email' => 'cs@victorylabs.id',
                'role' => 'Customer Service',
            ],
            [
                'name' => 'Designer User',
                'email' => 'designer@victorylabs.id',
                'role' => 'Designer',
            ],
            [
                'name' => 'Finance User',
                'email' => 'finance@victorylabs.id',
                'role' => 'Finance',
            ],
            [
                'name' => 'PPIC User',
                'email' => 'ppic@victorylabs.id',
                'role' => 'PPIC',
            ],
            [
                'name' => 'Produksi User',
                'email' => 'produksi@victorylabs.id',
                'role' => 'Produksi',
            ],
        ];

        foreach ($users as $row) {
            $user = User::firstOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'password' => bcrypt('password!'),
                ]
            );

            $user->syncRoles([$row['role']]);
        }
    }
}