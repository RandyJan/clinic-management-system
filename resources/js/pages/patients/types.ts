export type Patient = {
    id: number;
    patient_code: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    full_name: string;
    gender: 'female' | 'male' | 'other';
    birthdate: string;
    age: number | null;
    civil_status?: 'single' | 'married' | 'widowed' | 'separated' | null;
    contact_number: string;
    email: string | null;
    address?: string;
    emergency_contact_name?: string | null;
    emergency_contact_number?: string | null;
    blood_type?: string | null;
    allergies?: string | null;
    existing_conditions?: string | null;
    status: 'active' | 'inactive';
    created_at?: string | null;
    updated_at: string | null;
};

export type MedicalHistory = {
    appointments: Record<string, unknown>[];
    consultations: Record<string, unknown>[];
    prescriptions: Record<string, unknown>[];
    laboratory_requests: Record<string, unknown>[];
    billing_history: Record<string, unknown>[];
};

export type PatientFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    gender: string;
    birthdate: string;
    civil_status: string;
    contact_number: string;
    email: string;
    address: string;
    emergency_contact_name: string;
    emergency_contact_number: string;
    blood_type: string;
    allergies: string;
    existing_conditions: string;
};

