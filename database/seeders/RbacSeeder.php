<?php

namespace Database\Seeders;

use App\Services\RoleManagementService;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect(RoleManagementService::DEFAULT_PERMISSIONS)
            ->map(fn (string $permissionName): Permission => Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]));

        $administratorRole = Role::firstOrCreate([
            'name' => 'Administrator',
            'guard_name' => 'web',
        ]);

        $guestRole = Role::firstOrCreate([
            'name' => 'Guest',
            'guard_name' => 'web',
        ]);

        $receptionistRole = Role::firstOrCreate([
            'name' => 'Receptionist',
            'guard_name' => 'web',
        ]);

        $doctorRole = Role::firstOrCreate([
            'name' => 'Doctor',
            'guard_name' => 'web',
        ]);

        $nurseRole = Role::firstOrCreate([
            'name' => 'Nurse',
            'guard_name' => 'web',
        ]);

        $administratorRole->syncPermissions($permissions);
        $guestRole->syncPermissions(
            $permissions->where('name', 'dashboard.view')->values()
        );
        $receptionistRole->syncPermissions(
            $permissions
                ->whereIn('name', [
                    'dashboard.view',
                    'patients.view',
                    'patients.create',
                    'patients.update',
                    'patients.deactivate',
                    'doctors.assign',
                    'queues.view',
                    'queues.check-in',
                ])
                ->values()
        );
        $doctorRole->syncPermissions(
            $permissions
                ->whereIn('name', [
                    'dashboard.view',
                    'doctors.own.view',
                    'queues.call',
                ])
                ->values()
        );
        $nurseRole->syncPermissions(
            $permissions
                ->whereIn('name', [
                    'dashboard.view',
                    'queues.view',
                    'queues.call',
                ])
                ->values()
        );

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
