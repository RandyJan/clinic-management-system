<?php

namespace App\Http\Requests;

use App\Models\LaboratoryRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateLabRequestStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $laboratoryRequest = $this->route('laboratoryRequest');

        return $laboratoryRequest instanceof LaboratoryRequest
            && ($this->user()?->can('updateStatus', $laboratoryRequest) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['status' => ['required', Rule::in(LaboratoryRequest::STATUSES)]];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $laboratoryRequest = $this->route('laboratoryRequest');
            if ($laboratoryRequest instanceof LaboratoryRequest
                && $this->string('status')->toString() === LaboratoryRequest::STATUS_COMPLETED
                && ! $laboratoryRequest->labResult()->exists()) {
                $validator->errors()->add('status', 'Upload result details before completing the laboratory request.');
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'status.required' => 'The laboratory request status is required.',
            'status.in' => 'The selected laboratory request status is invalid.',
        ];
    }
}
