<?php

namespace Database\Factories;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\LaboratoryRequest;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LaboratoryRequest>
 */
class LaboratoryRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'lab_request_number' => 'LAB-'.now()->format('Ymd').'-'.fake()->unique()->bothify('######'),
            'consultation_id' => Consultation::factory(),
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'tests' => fake()->randomElement(['CBC, Urinalysis', 'Chest X-ray', 'Fasting blood sugar, Lipid profile']),
            'instructions' => fake()->optional()->sentence(),
            'requested_tests' => ['Complete blood count', 'Urinalysis'],
            'clinical_notes' => fake()->optional()->sentence(),
            'status' => LaboratoryRequest::STATUS_PENDING,
            'requested_at' => now(),
            'completed_at' => null,
            'result' => null,
            'result_notes' => null,
            'resulted_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => LaboratoryRequest::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }
}
