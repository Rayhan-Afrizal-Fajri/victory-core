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
            'dashboard.view',
            'kanban.view',
            'worker.view',

            'order_entry.view',
            'invoices.view',
            
            'purchasings.view',
            'job_tickets.view',
            'job_tickets.edit',
            'job_tickets.delete',
            'job_tickets.show',

            'designs.upload',
            'designs.approve',
            'designs.revision',
            'boms.sync',
            'boms.create',
            'boms.edit',
            'boms.delete',
            'manufactures.create',
            'manufactures.edit',
            'manufactures.delete',

            'costings.input_price',
            'quotation.generate',
            'quotation.print',
            'quotation.approve',

            'invoices.show',
            'invoices.print',
            'invoices.pay',
            'invoices.verify',
            'invoices.edit',
            'invoices.delete',

            'purchasings.generate',
            'purchasings.create',
            'purchasings.edit',
            'purchasings.mark_ordered',
            'purchasings.receive',
            'purchasings.delete',

            'samples.start',
            'samples.complete',
            'samples.packing',
            'samples.delivery',
            'samples.approve',
            'samples.revision',

            'productions.run',
            'productions.packing',
            'productions.delivery',

            'activities.view',
            'report.view',

            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',

            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',
            'customers.show',

            'suppliers.view',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',
            'suppliers.show',

            'companies.view',
            'companies.create',
            'companies.edit',
            'companies.delete',

            'sizes.view',
            'sizes.create',
            'sizes.edit',
            'sizes.delete',

            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'products.switch_status',
            'products.switch_pola',
            'products.show',
            'products.modify_materials',
            'products.modify_accecories',

            'materials.view',
            'materials.create',
            
            'manufactures.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            'Owner',
            'Manager',
            'Finance',
            'Designer',
            'Admin',
            'Purchasing',
            'Kepala Produksi',
            'Customer',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        Role::findByName('Owner')->syncPermissions($permissions);

        Role::findByName('Manager')->syncPermissions([
            'dashboard.admin',
            'dashboard.view',
            'kanban.view',
            'worker.view',

            'order_entry.view',
            'invoices.view',
            
            'purchasings.view',
            'job_tickets.view',
            'job_tickets.show',

            'designs.approve',
            'designs.revision',

            'costings.input_price',
            'quotation.generate',
            'quotation.print',
            'quotation.approve',

            'invoices.show',
            'invoices.print',

            'activities.view',
            'report.view',

            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            'roles.view',

            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',
            'customers.show',

            'suppliers.view',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',
            'suppliers.show',

            'companies.view',
            'companies.create',
            'companies.edit',
            'companies.delete',

            'sizes.view',
            'sizes.create',
            'sizes.edit',
            'sizes.delete',

            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'products.switch_status',
            'products.switch_pola',
            'products.show',
            'products.modify_materials',
            'products.modify_accecories',

            'materials.view',
            'materials.create',
            
            'manufactures.view',
        ]);

        Role::findByName('Finance')->syncPermissions([
            'dashboard.admin',
            'dashboard.view',
            'kanban.view',

            'invoices.view',
            
            'job_tickets.view',
            'job_tickets.show',

            'invoices.show',
            'invoices.print',
            'invoices.pay',
            'invoices.verify',
            'invoices.edit',
            'invoices.delete',

            'activities.view',
            'report.view',
        ]);

        Role::findByName('Designer')->syncPermissions([
            'dashboard.admin',
            'dashboard.view',
            'kanban.view',
            
            'job_tickets.view',
            'job_tickets.show',

            'designs.upload',
            'boms.sync',
            'boms.create',
            'boms.edit',
            'boms.delete',

            'samples.start',
            'samples.complete',
            'samples.packing',
            'samples.delivery',
            'samples.approve',
            'samples.revision',

            'activities.view',
        ]);

        Role::findByName('Admin')->syncPermissions([
            'dashboard.admin',
            'dashboard.view',
            'kanban.view',

            'order_entry.view',
            'invoices.view',
            
            'purchasings.view',
            'job_tickets.view',
            'job_tickets.edit',
            'job_tickets.delete',
            'job_tickets.show',

            'designs.approve',
            'designs.revision',

            'costings.input_price',
            'quotation.generate',
            'quotation.print',
            'quotation.approve',

            'invoices.show',
            'invoices.print',
            'invoices.pay',

            'samples.start',
            'samples.complete',
            'samples.packing',
            'samples.delivery',
            'samples.approve',
            'samples.revision',

            'activities.view',
            'report.view',

            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',

            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',
            'customers.show',

            'suppliers.view',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',
            'suppliers.show',

            'companies.view',
            'companies.create',
            'companies.edit',
            'companies.delete',

            'sizes.view',
            'sizes.create',
            'sizes.edit',
            'sizes.delete',

            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'products.switch_status',
            'products.switch_pola',
            'products.show',
            'products.modify_materials',
            'products.modify_accecories',

            'materials.view',
            'materials.create',
            
            'manufactures.view',
        ]);

        Role::findByName('Purchasing')->syncPermissions([
            'dashboard.admin',
            'dashboard.view',
            'kanban.view',
            
            'purchasings.view',
            'job_tickets.view',
            'job_tickets.show',

            'purchasings.generate',
            'purchasings.mark_ordered',

            'activities.view',
        ]);

        Role::findByName('Kepala Produksi')->syncPermissions([
            'dashboard.admin',
            'dashboard.view',
            'kanban.view',
            
            'purchasings.view',
            'job_tickets.view',
            'job_tickets.show',

            'manufactures.create',
            'manufactures.edit',
            'manufactures.delete',

            'purchasings.generate',
            'purchasings.create',
            'purchasings.edit',
            'purchasings.mark_ordered',
            'purchasings.receive',

            'productions.run',
            'productions.packing',
            'productions.delivery',

            'activities.view',
        ]);

        $users = [
            [
                'name' => 'Victor Harlim, SE. MBA',
                'email' => 'owner@victorylabs.id',
                'role' => 'Owner',
            ],
            [
                'name' => 'Manager Victory',
                'email' => 'manager@victorylabs.id',
                'role' => 'Manager',
            ],
            [
                'name' => 'Finance Victory',
                'email' => 'finance@victorylabs.id',
                'role' => 'Finance',
            ],
            [
                'name' => 'Designer Victory',
                'email' => 'designer@victorylabs.id',
                'role' => 'Designer',
            ],
            [
                'name' => 'Admin Victory',
                'email' => 'admin@victorylabs.id',
                'role' => 'Admin',
            ],
            [
                'name' => 'Purchasing Victory',
                'email' => 'purchasing@victorylabs.id',
                'role' => 'Purchasing',
            ],
            [
                'name' => 'Kepala Produksi Victory',
                'email' => 'kepala_produksi@victorylabs.id',
                'role' => 'Kepala Produksi',
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