<?php

namespace App\Http\Requests;

use App\Models\LaboratoryRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreLabResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        $laboratoryRequest = $this->route('laboratoryRequest');

        return $laboratoryRequest instanceof LaboratoryRequest
            && ($this->user()?->can('uploadResult', $laboratoryRequest) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'result_details' => ['required', 'string', 'max:20000'],
            'attachment' => ['nullable', File::types(['pdf', 'jpg', 'jpeg', 'png', 'webp'])->max('10mb')],
            'remarks' => ['nullable', 'string', 'max:4000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'result_details.required' => 'Result details are required when completing the laboratory request.',
            'attachment.mimes' => 'The attachment must be a PDF or image file.',
            'attachment.max' => 'The attachment may not be larger than 10 MB.',
        ];
    }
}
