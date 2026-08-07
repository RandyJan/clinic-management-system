export type CertificatePatient = {
    id: number;
    patient_code: string;
    full_name: string;
    birthdate: string | null;
    age: number | null;
    gender: string | null;
    address: string | null;
};

export type CertificateDoctor = {
    id: number;
    full_name: string;
    specialization: string;
    license_number: string;
};

export type CertificateConsultation = {
    id: number;
    consultation_number: string;
    chief_complaint?: string | null;
    patient_id?: number;
    doctor_id?: number;
    diagnosis?: string | null;
    patient?: CertificatePatient;
    doctor?: CertificateDoctor;
};

export type MedicalCertificate = {
    id: number;
    certificate_number: string;
    patient_id: number;
    consultation_id: number;
    doctor_id: number;
    diagnosis: string;
    recommendation: string;
    rest_days: number | null;
    issued_date: string;
    remarks: string | null;
    created_at: string | null;
    updated_at: string | null;
    patient: CertificatePatient;
    consultation: CertificateConsultation;
    doctor: CertificateDoctor;
};

export type MedicalCertificateHistoryItem = {
    id: number;
    certificate_number: string;
    consultation_id: number;
    diagnosis: string;
    recommendation: string;
    rest_days: number | null;
    issued_date: string | null;
    doctor: {
        id: number;
        full_name: string;
        specialization: string;
    };
    consultation: {
        id: number;
        consultation_number: string;
    };
};
