<?php

namespace Database\Factories;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\MedicalCertificate;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MedicalCertificate>
 */
class MedicalCertificateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $consultation = Consultation::factory()->create();

        return [
            'certificate_number' => 'MC-'.fake()->unique()->numerify('########'),
            'patient_id' => $consultation->patient_id,
            'consultation_id' => $consultation->id,
            'doctor_id' => $consultation->doctor_id,
            'diagnosis' => fake()->sentence(),
            'recommendation' => fake()->sentence(),
            'rest_days' => fake()->numberBetween(1, 7),
            'issued_date' => now()->toDateString(),
            'remarks' => fake()->optional()->sentence(),
        ];
    }

    public function forPatientConsultation(Patient $patient, Consultation $consultation, Doctor $doctor): static
    {
        return $this->state(fn (): array => [
            'patient_id' => $patient->id,
            'consultation_id' => $consultation->id,
            'doctor_id' => $doctor->id,
        ]);
    }
}
