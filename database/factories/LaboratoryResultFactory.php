<?php

namespace Database\Factories;

use App\Models\LaboratoryRequest;
use App\Models\LaboratoryResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<LaboratoryResult> */
class LaboratoryResultFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'lab_request_id' => LaboratoryRequest::factory(),
            'result_details' => fake()->paragraph(),
            'attachment_path' => null,
            'remarks' => fake()->optional()->sentence(),
            'uploaded_by' => User::factory(),
            'uploaded_at' => now(),
        ];
    }
}
