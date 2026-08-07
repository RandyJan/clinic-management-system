export type MedicineStatus = 'active' | 'inactive';

export type Medicine = {
    id: number;
    medicine_code: string | null;
    sku: string | null;
    name: string;
    generic_name: string | null;
    brand_name: string | null;
    category: string | null;
    dosage_form: string | null;
    strength: string | null;
    unit: string;
    current_stock: number;
    stock_quantity: number;
    reorder_level: number;
    expiry_date: string | null;
    selling_price: number;
    cost_price: number;
    status: MedicineStatus;
    created_at: string | null;
    updated_at: string | null;
    is_low_stock: boolean;
    is_expired: boolean;
    is_near_expiry: boolean;
};

export type PaginatedMedicines = {
    data: Medicine[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type StockTransaction = {
    id: number;
    medicine_id: number;
    transaction_type: string;
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reference_type: string | null;
    reference_id: number | null;
    remarks: string | null;
    created_by: string | null;
    created_at: string | null;
};

export type PaginatedStockTransactions = {
    data: StockTransaction[];
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};
