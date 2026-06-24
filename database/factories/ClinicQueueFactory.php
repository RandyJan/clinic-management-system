<?php

namespace Database\Factories;

use App\Models\ClinicQueue;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClinicQueue>
 */
class ClinicQueueFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'queue_number' => 'Q-'.fake()->unique()->numberBetween(1, 9999),
            'appointment_id' => null,
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'queue_date' => now()->toDateString(),
            'status' => ClinicQueue::STATUS_WAITING,
            'checked_in_at' => now(),
            'called_at' => null,
            'completed_at' => null,
        ];
    }

    public function called(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ClinicQueue::STATUS_CALLED,
            'called_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ClinicQueue::STATUS_COMPLETED,
            'called_at' => now()->subMinutes(15),
            'completed_at' => now(),
        ]);
    }
}
