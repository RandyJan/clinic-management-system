<?php

use App\Services\MedicalRecordPdfService;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;

test('it renders a valid multi-section pdf document', function () {
    $container = new Container;
    $container->instance('config', new Repository(['app' => ['name' => 'Clinic Management System']]));
    Container::setInstance($container);

    $pdf = (new MedicalRecordPdfService)->render([
        'patient' => [
            'full_name' => 'Maria Santos',
            'patient_code' => 'PAT-001',
            'birthdate' => '1990-01-01',
            'age' => 36,
            'gender' => 'female',
            'blood_type' => 'O+',
            'contact_number' => '09123456789',
            'email' => 'maria@example.test',
            'address' => 'Manila',
            'allergies' => 'Penicillin',
            'existing_conditions' => 'Asthma',
        ],
        'consultations' => [],
        'prescriptions' => [],
        'laboratory_requests' => [],
        'vital_signs' => [],
        'follow_ups' => [],
    ]);

    expect($pdf)
        ->toStartWith('%PDF-1.4')
        ->toContain('Maria Santos', 'PAT-001', 'CONSULTATION HISTORY')
        ->toEndWith('%%EOF');
});
