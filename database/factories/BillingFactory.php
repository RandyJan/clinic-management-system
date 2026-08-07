<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Billing;
use App\Models\Consultation;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Billing> */
class BillingFactory extends Factory
{
    protected $model = Billing::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'invoice_number' => 'INV-'.now()->format('Ymd').'-'.fake()->unique()->bothify('??????'),
            'patient_id' => Patient::factory(),
            'appointment_id' => null,
            'consultation_id' => null,
            'total_amount' => 1000,
            'discount' => 0,
            'tax' => 0,
            'grand_total' => 1000,
            'payment_status' => Billing::STATUS_UNPAID,
            'created_by' => User::factory(),
        ];
    }

    public function forAppointment(Appointment $appointment): static
    {
        return $this->state(fn (): array => [
            'patient_id' => $appointment->patient_id,
            'appointment_id' => $appointment->id,
        ]);
    }

    public function forConsultation(Consultation $consultation): static
    {
        return $this->state(fn (): array => [
            'patient_id' => $consultation->patient_id,
            'appointment_id' => $consultation->appointment_id,
            'consultation_id' => $consultation->id,
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (): array => ['payment_status' => Billing::STATUS_PAID]);
    }
}
