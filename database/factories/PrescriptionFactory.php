<?php

namespace Database\Factories;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Prescription>
 */
class PrescriptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'prescription_number' => 'RX-'.now()->format('Ymd').'-'.fake()->unique()->bothify('######'),
            'consultation_id' => Consultation::factory(),
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'medications' => fake()->sentence(8),
            'instructions' => fake()->paragraph(),
            'status' => Prescription::STATUS_PENDING,
            'notes' => fake()->optional()->sentence(),
            'dispensed_by' => null,
            'dispensed_at' => null,
        ];
    }

    public function dispensed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Prescription::STATUS_DISPENSED,
            'dispensed_at' => now(),
        ]);
    }
}
