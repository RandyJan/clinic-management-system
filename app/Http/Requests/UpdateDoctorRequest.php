<?php

namespace App\Http\Requests;

class UpdateDoctorRequest extends StoreDoctorRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('doctors.update') ?? false;
    }
}
