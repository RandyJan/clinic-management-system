export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';

export type BillingSummary = {
    id: number;
    invoice_number: string;
    patient_id: number;
    appointment_id: number | null;
    consultation_id: number | null;
    total_amount: number;
    discount: number;
    tax: number;
    grand_total: number;
    amount_paid: number;
    balance_due: number;
    payment_status: PaymentStatus;
    created_at: string | null;
    updated_at: string | null;
    patient: { id: number; patient_code: string; full_name: string };
};

export type BillingDetail = BillingSummary & {
    appointment: null | { id: number; appointment_number: string };
    consultation: null | {
        id: number;
        consultation_number: string;
        diagnosis: string | null;
    };
    created_by: string | null;
    cancelled_remarks: string | null;
    cancelled_at: string | null;
    items: BillingItem[];
    payments: PaymentRecord[];
};

export type BillingItem = {
    id?: number;
    service_id: number | null;
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
};

export type PaymentRecord = {
    id: number;
    payment_reference: string;
    payment_method: string;
    amount_paid: number;
    change_amount: number;
    payment_date: string | null;
    received_by: string | null;
    remarks: string | null;
};

export type PaginatedBillings = {
    data: BillingSummary[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type BillingSource = {
    appointment_id: number | null;
    appointment_number: string | null;
    consultation_id: number | null;
    consultation_number: string | null;
    patient_id: number | null;
    patient_name: string | null;
    patient_code: string | null;
};

export type PatientOption = {
    id: number;
    full_name: string;
    patient_code: string;
};

export type ServiceOption = {
    id: number;
    service_code: string;
    name: string;
    category: string;
    price: number;
    status: 'active' | 'inactive';
};
