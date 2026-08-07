export type ServiceStatus = 'active' | 'inactive';

export type ServiceCategory =
    | 'Consultation'
    | 'Laboratory'
    | 'Procedure'
    | 'Medical Certificate'
    | 'Other';

export type ServiceSummary = {
    id: number;
    service_code: string;
    name: string;
    description: string | null;
    category: ServiceCategory;
    price: number;
    status: ServiceStatus;
    created_at: string | null;
    updated_at: string | null;
};

export type ServicePriceHistory = {
    id: number;
    old_price: number;
    new_price: number;
    changed_by: string | null;
    created_at: string | null;
};

export type ServiceDetail = ServiceSummary & {
    price_histories: ServicePriceHistory[];
};

export type PaginatedServices = {
    data: ServiceSummary[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};
