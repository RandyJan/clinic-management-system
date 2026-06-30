export type LabRequestStatus =
    | 'Pending'
    | 'In Progress'
    | 'Completed'
    | 'Cancelled';

export type LabRequestSummary = {
    id: number;
    lab_request_number: string;
    consultation_id: number;
    patient_id: number;
    doctor_id: number;
    requested_tests: string[];
    status: LabRequestStatus;
    has_result: boolean;
    requested_at: string | null;
    completed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    patient: { id: number; patient_code: string; full_name: string };
    doctor: { id: number; full_name: string; specialization: string };
};

export type PaginatedLabRequests = {
    data: LabRequestSummary[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type LabRequestDetail = LabRequestSummary & {
    clinical_notes: string | null;
    consultation: {
        id: number;
        consultation_number: string;
        diagnosis: string | null;
    };
    patient: LabRequestSummary['patient'] & {
        birthdate: string | null;
        address: string;
    };
    doctor: LabRequestSummary['doctor'] & { license_number: string };
    result: null | {
        id: number;
        result_details: string;
        remarks: string | null;
        has_attachment: boolean;
        uploaded_by: string | null;
        uploaded_at: string | null;
    };
};

export type LabConsultation = {
    id: number;
    consultation_number: string;
    patient_id: number;
    doctor_id: number;
    patient: { full_name: string; patient_code: string };
    doctor: { full_name: string; specialization: string };
};
