export type ConsultationStatus = 'In Progress' | 'Completed' | 'Cancelled';

export type ConsultationRecord = {
    id: number;
    consultation_number: string;
    appointment_id: number;
    patient_id: number;
    doctor_id: number;
    chief_complaint: string | null;
    history_of_present_illness: string | null;
    diagnosis: string | null;
    treatment_plan: string | null;
    doctor_notes: string | null;
    follow_up_date: string | null;
    status: ConsultationStatus;
    started_at: string | null;
    completed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    appointment: {
        id: number;
        appointment_number: string;
        appointment_date: string;
        appointment_time: string;
    };
    patient: {
        id: number;
        full_name: string;
        patient_code: string;
    };
    doctor: {
        id: number;
        full_name: string;
        specialization: string;
    };
    prescriptions: PrescriptionRecord[];
    laboratory_requests: LaboratoryRequestRecord[];
};

export type ConsultationHistoryItem = {
    id: number;
    consultation_number: string;
    appointment_id: number;
    diagnosis: string | null;
    follow_up_date: string | null;
    completed_at: string | null;
    doctor: {
        id: number;
        full_name: string;
        specialization: string;
    };
    appointment: {
        id: number;
        appointment_number: string;
        appointment_date: string;
    };
};

export type PrescriptionRecord = {
    id: number;
    medications: string;
    instructions: string | null;
};

export type LaboratoryRequestRecord = {
    id: number;
    tests: string;
    instructions: string | null;
    status: string;
};

export type ConsultationFormData = {
    chief_complaint: string;
    history_of_present_illness: string;
    diagnosis: string;
    treatment_plan: string;
    doctor_notes: string;
    follow_up_date: string;
    prescription_medications: string;
    prescription_instructions: string;
    laboratory_tests: string;
    laboratory_instructions: string;
};
