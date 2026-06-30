export type PrescriptionStatus = 'Pending' | 'Dispensed' | 'Cancelled';

export type PrescriptionSummary = {
    id: number;
    prescription_number: string;
    consultation_id: number;
    patient_id: number;
    doctor_id: number;
    status: PrescriptionStatus;
    items_count: number;
    created_at: string | null;
    updated_at: string | null;
    dispensed_at: string | null;
    patient: { id: number; patient_code: string; full_name: string };
    doctor: { id: number; full_name: string; specialization: string };
};

export type PaginatedPrescriptions = {
    data: PrescriptionSummary[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type PrescriptionDetail = PrescriptionSummary & {
    notes: string | null;
    dispensed_by: string | null;
    consultation: {
        id: number;
        consultation_number: string;
        diagnosis: string | null;
    };
    patient: PrescriptionSummary['patient'] & {
        birthdate: string | null;
        address: string;
    };
    doctor: PrescriptionSummary['doctor'] & { license_number: string };
    items: Array<{
        id: number;
        medicine_id: number | null;
        medicine_name: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: number;
        instructions: string | null;
        unit: string | null;
        stock_quantity: number | null;
    }>;
};

export type MedicineOption = {
    id: number;
    sku: string | null;
    name: string;
    unit: string;
    stock_quantity: number;
};

export type PrescriptionConsultation = {
    id: number;
    consultation_number: string;
    patient_id: number;
    doctor_id: number;
    patient: { full_name: string; patient_code: string };
    doctor: { full_name: string; specialization: string };
};

export type PrescriptionFormItem = {
    medicine_id: string;
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: string;
    instructions: string;
};

export type PrescriptionFormData = {
    consultation_id: number;
    patient_id: number;
    doctor_id: number;
    notes: string;
    items: PrescriptionFormItem[];
};
