export type VitalSign = {
    id: number;
    patient_id: number;
    appointment_id: number;
    recorded_by: number | null;
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
    created_at: string | null;
    updated_at: string | null;
    appointment?: {
        id: number;
        appointment_number: string;
        appointment_date: string | null;
        appointment_time: string | null;
    } | null;
    recorder?: {
        id: number;
        name: string;
        email: string | null;
        username: string | null;
    } | null;
};

export type VitalSignAppointment = {
    id: number;
    appointment_number: string;
    patient_id: number;
    doctor_id: number;
    appointment_date: string | null;
    appointment_time: string | null;
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
};

export type VitalSignFormData = {
    patient_id: string;
    appointment_id: string;
    temperature: string;
    blood_pressure: string;
    pulse_rate: string;
    respiratory_rate: string;
    oxygen_saturation: string;
    height: string;
    weight: string;
    notes: string;
    recorded_at: string;
};
