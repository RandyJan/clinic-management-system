<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'appointment_number' => 'APT-'.now()->format('Ymd').'-'.fake()->unique()->numerify('####'),
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'appointment_date' => now()->addDay()->toDateString(),
            'appointment_time' => fake()->time('H:i'),
            'reason_for_visit' => fake()->sentence(4),
            'appointment_type' => fake()->randomElement(['Consultation', 'Follow-up', 'Emergency']),
            'status' => Appointment::STATUS_PENDING,
            'remarks' => null,
            'created_by' => User::factory(),
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Appointment::STATUS_CONFIRMED,
        ]);
    }

    public function checkedIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Appointment::STATUS_CHECKED_IN,
        ]);
    }
}
