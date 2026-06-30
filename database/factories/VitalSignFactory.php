<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VitalSign>
 */
class VitalSignFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $height = fake()->randomFloat(2, 145, 190);
        $weight = fake()->randomFloat(2, 45, 95);
        $patient = Patient::factory();

        return [
            'patient_id' => $patient,
            'appointment_id' => Appointment::factory()->for($patient),
            'recorded_by' => User::factory(),
            'temperature' => fake()->randomFloat(1, 36.0, 38.0),
            'blood_pressure' => fake()->randomElement(['110/70', '120/80', '130/85']),
            'pulse_rate' => fake()->numberBetween(60, 100),
            'respiratory_rate' => fake()->numberBetween(12, 20),
            'oxygen_saturation' => fake()->numberBetween(95, 100),
            'height' => $height,
            'weight' => $weight,
            'bmi' => round($weight / (($height / 100) ** 2), 2),
            'notes' => null,
            'recorded_at' => now(),
        ];
    }
}
