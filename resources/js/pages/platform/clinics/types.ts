export type ClinicStatus = 'active' | 'inactive';

export type Clinic = {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    contact_number: string | null;
    address: string | null;
    status: ClinicStatus;
    created_at: string;
    updated_at: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedClinics = {
    data: Clinic[];
    current_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

export type MembershipOption = { id: number; name: string };

export type MembershipUser = {
    id: number;
    name: string;
    email: string | null;
    username: string | null;
};

export type ClinicMembership = {
    id: number;
    clinic_id: number;
    user_id: number;
    role_id: number;
    status: ClinicStatus;
    user: MembershipUser;
    role: MembershipOption;
};
