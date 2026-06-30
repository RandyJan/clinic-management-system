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

        $patientRole = Role::firstOrCreate([
            'name' => 'Patient',
            'guard_name' => 'web',
        ]);

        $pharmacistRole = Role::firstOrCreate([
            'name' => 'Pharmacist',
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
                    'appointments.view',
                    'appointments.create',
                    'appointments.update',
                    'appointments.check-in',
                    'appointments.own.view',
                    'consultations.view',
                    'vital-signs.view',
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
                    'appointments.own.view',
                    'appointments.manage-consultations',
                    'consultations.view',
                    'consultations.update',
                    'medical-records.assigned.view',
                    'prescriptions.doctor.view',
                    'prescriptions.create',
                    'laboratory-requests.doctor.view',
                    'laboratory-requests.create',
                    'vital-signs.view',
                    'queues.call',
                ])
                ->values()
        );
        $nurseRole->syncPermissions(
            $permissions
                ->whereIn('name', [
                    'dashboard.view',
                    'patients.view',
                    'appointments.own.view',
                    'consultations.view',
                    'vital-signs.view',
                    'vital-signs.create',
                    'laboratory-requests.view',
                    'laboratory-requests.update-status',
                    'laboratory-requests.upload-results',
                    'queues.view',
                    'queues.call',
                ])
                ->values()
        );
        $patientRole->syncPermissions(
            $permissions
                ->whereIn('name', [
                    'dashboard.view',
                    'medical-records.own.view',
                    'prescriptions.own.view',
                    'laboratory-requests.own.view',
                ])
                ->values()
        );
        $pharmacistRole->syncPermissions(
            $permissions
                ->whereIn('name', [
                    'dashboard.view',
                    'prescriptions.view',
                    'prescriptions.dispense',
                ])
                ->values()
        );

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
