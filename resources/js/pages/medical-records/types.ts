export type MedicalRecordPatient = {
    id: number;
    patient_code: string;
    full_name: string;
    gender: string;
    birthdate: string | null;
    age: number | null;
    civil_status: string | null;
    contact_number: string;
    email: string | null;
    address: string;
    emergency_contact_name: string | null;
    emergency_contact_number: string | null;
    blood_type: string | null;
    allergies: string | null;
    existing_conditions: string | null;
};

export type MedicalRecord = {
    patient: MedicalRecordPatient;
    consultations: Array<{
        id: number;
        consultation_number: string;
        chief_complaint: string | null;
        history_of_present_illness: string | null;
        diagnosis: string | null;
        treatment_plan: string | null;
        doctor_notes: string | null;
        follow_up_date: string | null;
        status: string;
        started_at: string | null;
        completed_at: string | null;
        doctor: {
            full_name: string;
            specialization: string;
            license_number: string;
        };
        appointment: {
            appointment_number: string;
            appointment_date: string | null;
            appointment_time: string | null;
            reason_for_visit: string | null;
        };
    }>;
    diagnoses: Array<{
        consultation_number: string;
        diagnosis: string;
        diagnosed_at: string | null;
        doctor_name: string;
    }>;
    prescriptions: Array<{
        id: number;
        consultation_number: string;
        medications: string;
        instructions: string | null;
        prescribed_at: string | null;
        doctor_name: string;
    }>;
    laboratory_requests: Array<{
        id: number;
        consultation_number: string;
        tests: string;
        instructions: string | null;
        status: string;
        result: string | null;
        result_notes: string | null;
        requested_at: string | null;
        resulted_at: string | null;
        doctor_name: string;
    }>;
    vital_signs: Array<{
        id: number;
        temperature: string | null;
        blood_pressure: string | null;
        pulse_rate: number | null;
        respiratory_rate: number | null;
        oxygen_saturation: number | null;
        height: string | null;
        weight: string | null;
        bmi: string | null;
        notes: string | null;
        recorded_at: string | null;
        recorded_by: string | null;
        appointment_number: string | null;
    }>;
    follow_ups: Array<{
        consultation_number: string;
        follow_up_date: string;
        treatment_plan: string | null;
        doctor_name: string;
    }>;
};

export type MedicalRecordSummary = {
    id: number;
    patient_code: string;
    full_name: string;
    birthdate: string | null;
    age: number | null;
    gender: string;
    contact_number: string;
    consultations_count: number;
    vital_signs_count: number;
    last_consultation_at: string | null;
};

export type PaginatedMedicalRecords = {
    data: MedicalRecordSummary[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};
