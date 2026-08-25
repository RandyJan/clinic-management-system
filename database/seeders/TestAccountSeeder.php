<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TestAccountSeeder extends Seeder
{
    private const PASSWORD = 'password';

    /**
     * @var array<string, array{name: string, username: string, email: string}>
     */
    private const ACCOUNTS = [
        'Platform Administrator' => [
            'name' => 'Test Platform Administrator',
            'username' => 'platform-admin',
            'email' => 'platformadmin@clinic.test',
        ],
        'Administrator' => [
            'name' => 'Test Administrator',
            'username' => 'admin',
            'email' => 'admin@clinic.test',
        ],
        'Receptionist' => [
            'name' => 'Test Receptionist',
            'username' => 'receptionist',
            'email' => 'receptionist@clinic.test',
        ],
        'Doctor' => [
            'name' => 'Test Doctor',
            'username' => 'doctor',
            'email' => 'doctor@clinic.test',
        ],
        'Nurse' => [
            'name' => 'Test Nurse',
            'username' => 'nurse',
            'email' => 'nurse@clinic.test',
        ],
        'Cashier' => [
            'name' => 'Test Cashier',
            'username' => 'cashier',
            'email' => 'cashier@clinic.test',
        ],
        'Pharmacist' => [
            'name' => 'Test Pharmacist',
            'username' => 'pharmacist',
            'email' => 'pharmacist@clinic.test',
        ],
        'Patient' => [
            'name' => 'Test Patient',
            'username' => 'patient',
            'email' => 'patient@clinic.test',
        ],
        'Guest' => [
            'name' => 'Test Guest',
            'username' => 'guest',
            'email' => 'guest@clinic.test',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RbacSeeder::class);

        foreach (self::ACCOUNTS as $roleName => $account) {
            $user = $this->upsertUser($account);
            $user->syncRoles([$this->role($roleName)]);

            if ($roleName === 'Doctor') {
                $this->upsertDoctorProfile($user);
            }

            if ($roleName === 'Patient') {
                $this->upsertPatientProfile($user);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * @param  array{name: string, username: string, email: string}  $account
     */
    private function upsertUser(array $account): User
    {
        $user = User::query()->updateOrCreate(
            ['username' => $account['username']],
            [
                'name' => $account['name'],
                'email' => $account['email'],
                'password' => Hash::make(self::PASSWORD),
                'is_active' => true,
            ]
        );

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        return $user;
    }

    private function role(string $roleName): Role
    {
        return Role::findByName($roleName, 'web');
    }

    private function upsertDoctorProfile(User $user): void
    {
        Doctor::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'doctor_code' => 'DOC-TEST-0001',
                'first_name' => 'Test',
                'last_name' => 'Doctor',
                'specialization' => 'Family Medicine',
                'license_number' => 'PRC-TEST-0001',
                'contact_number' => '09170000001',
                'email' => $user->email,
                'consultation_fee' => 500,
                'schedule' => 'Monday to Friday, 8:00 AM - 5:00 PM',
                'status' => 'active',
            ]
        );
    }

    private function upsertPatientProfile(User $user): void
    {
        Patient::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'patient_code' => 'PAT-TEST-0001',
                'first_name' => 'Test',
                'middle_name' => null,
                'last_name' => 'Patient',
                'suffix' => null,
                'gender' => 'other',
                'birthdate' => '1990-01-01',
                'civil_status' => 'single',
                'contact_number' => '09170000002',
                'email' => $user->email,
                'address' => 'Test Address',
                'emergency_contact_name' => 'Test Emergency Contact',
                'emergency_contact_number' => '09170000003',
                'blood_type' => null,
                'allergies' => null,
                'existing_conditions' => null,
                'status' => 'active',
            ]
        );
    }
}
