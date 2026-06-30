export type AppointmentStatus =
    | 'Pending'
    | 'Confirmed'
    | 'Checked-in'
    | 'In Consultation'
    | 'Completed'
    | 'Cancelled'
    | 'No-show';

export type AppointmentItem = {
    id: number;
    appointment_number: string;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    reason_for_visit: string;
    appointment_type: string;
    status: AppointmentStatus;
    remarks: string | null;
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
    creator?: {
        id: number;
        name: string;
        email: string | null;
        username: string | null;
    } | null;
    consultation?: {
        id: number;
        consultation_number: string;
        status: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
};

export type PatientOption = {
    id: number;
    full_name: string;
    patient_code: string;
};

export type DoctorOption = {
    id: number;
    full_name: string;
    specialization: string;
};

export type AppointmentFormData = {
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    appointment_time: string;
    reason_for_visit: string;
    appointment_type: string;
    status: AppointmentStatus;
    remarks: string;
};

export type PaginatedAppointments = {
    data: AppointmentItem[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};
