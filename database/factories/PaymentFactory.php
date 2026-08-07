<?php

namespace Database\Factories;

use App\Models\Billing;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Payment> */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'billing_id' => Billing::factory(),
            'payment_reference' => 'PAY-'.now()->format('Ymd').'-'.fake()->unique()->bothify('??????'),
            'payment_method' => fake()->randomElement(Payment::METHODS),
            'amount_paid' => 1000,
            'change_amount' => 0,
            'payment_date' => now(),
            'received_by' => User::factory(),
            'remarks' => null,
        ];
    }
}
