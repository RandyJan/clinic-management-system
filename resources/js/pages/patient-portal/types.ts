import { AppointmentItem, PaginatedAppointments } from '../appointments/types';
import { BillingDetail } from '../billings/types';
import {
    LabRequestSummary,
    PaginatedLabRequests,
} from '../laboratory-requests/types';
import {
    PaginatedPrescriptions,
    PrescriptionSummary,
} from '../prescriptions/types';

export type PatientPortalPatient = {
    id: number;
    patient_code: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    full_name: string;
    gender: string;
    birthdate: string;
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
    status: string;
    created_at?: string | null;
    updated_at: string | null;
};

export type PatientPortalStats = {
    upcoming_appointments: number;
    completed_consultations: number;
    pending_prescriptions: number;
    unpaid_bills: number;
};

export type PatientPortalConsultation = {
    id: number;
    consultation_number: string;
    appointment_id: number;
    diagnosis: string | null;
    treatment_plan: string | null;
    follow_up_date: string | null;
    status: string;
    completed_at: string | null;
    doctor: {
        id: number;
        full_name: string;
        specialization: string;
    };
    appointment: {
        id: number;
        appointment_number: string;
        appointment_date: string | null;
        appointment_time: string | null;
    };
};

export type PatientPortalCertificate = {
    id: number;
    certificate_number: string;
    diagnosis: string;
    recommendation: string;
    rest_days: number | null;
    issued_date: string | null;
    print_url: string;
    doctor: {
        id: number;
        full_name: string;
        specialization: string;
    };
};

export type PaginatedPortalBills = {
    data: BillingDetail[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type PortalDashboardProps = {
    patient: PatientPortalPatient;
    stats: PatientPortalStats;
    appointments: AppointmentItem[];
    consultations: PatientPortalConsultation[];
    bills: BillingDetail[];
};

export type PortalAppointmentsProps = {
    appointments: PaginatedAppointments;
};

export type PortalPrescriptionsProps = {
    prescriptions: PaginatedPrescriptions;
};

export type PortalLabResultsProps = {
    laboratory_requests: PaginatedLabRequests;
};

export type PortalBillsProps = {
    billings: PaginatedPortalBills;
};

export type PortalRecordsProps = {
    patient: PatientPortalPatient;
    consultations: PatientPortalConsultation[];
    certificates: PatientPortalCertificate[];
};

export type PortalProfileProps = {
    patient: PatientPortalPatient;
};

export type PortalLabRequest = LabRequestSummary;
export type PortalPrescription = PrescriptionSummary;
