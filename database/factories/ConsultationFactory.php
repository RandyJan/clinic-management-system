<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Consultation>
 */
class ConsultationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'consultation_number' => 'CON-'.now()->format('Ymd').'-'.fake()->unique()->bothify('######'),
            'appointment_id' => Appointment::factory(),
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'chief_complaint' => fake()->sentence(6),
            'history_of_present_illness' => fake()->paragraph(),
            'diagnosis' => null,
            'treatment_plan' => null,
            'doctor_notes' => null,
            'follow_up_date' => null,
            'status' => Consultation::STATUS_IN_PROGRESS,
            'started_at' => now(),
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'diagnosis' => fake()->sentence(4),
            'treatment_plan' => fake()->paragraph(),
            'status' => Consultation::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }
}
