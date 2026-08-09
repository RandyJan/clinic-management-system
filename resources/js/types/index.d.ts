import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    roles: string[];
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    clinic: ClinicSettings;
    auth: Auth;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface ClinicSettings {
    clinic_name: string;
    clinic_address: string | null;
    contact_number: string | null;
    email: string | null;
    logo_url: string | null;
    consultation_default_fee: number;
    tax_rate: number;
    appointment_slot_duration: number;
    opening_time: string | null;
    closing_time: string | null;
    receipt_footer: string | null;
    certificate_footer: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string | null;
    username?: string | null;
    is_active?: boolean;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

declare global {
    interface Window {
        Pusher?: unknown;
    }
}
