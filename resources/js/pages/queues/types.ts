export type QueueStatus =
    | 'Waiting'
    | 'Called'
    | 'In Consultation'
    | 'Completed'
    | 'Skipped'
    | 'Cancelled';

export type QueueItem = {
    id: number;
    queue_number: string;
    appointment_id: number | null;
    appointment_number: string | null;
    patient_id: number;
    doctor_id: number;
    queue_date: string;
    status: QueueStatus;
    checked_in_at: string | null;
    called_at: string | null;
    completed_at: string | null;
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

export type AppointmentOption = {
    id: number;
    appointment_number: string;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    patient_name: string;
    doctor_name: string;
};

export type PaginatedQueues = {
    data: QueueItem[];
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
