export type DoctorUser = {
    id: number;
    name: string;
    email: string | null;
    username: string | null;
    is_active?: boolean;
};

export type Doctor = {
    id: number;
    user_id: number;
    doctor_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    specialization: string;
    license_number: string;
    contact_number: string | null;
    email: string | null;
    consultation_fee: string;
    schedule: string;
    status: 'active' | 'inactive';
    user: DoctorUser | null;
    created_at?: string | null;
    updated_at: string | null;
};

export type DoctorFormData = {
    user_id: string;
    first_name: string;
    last_name: string;
    specialization: string;
    license_number: string;
    contact_number: string;
    email: string;
    consultation_fee: string;
    schedule: string;
    status: string;
};

export type UserOption = {
    id: number;
    label: string;
    email: string | null;
};

export type DoctorActivity = Record<string, unknown>[];

