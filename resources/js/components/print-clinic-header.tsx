import { type ClinicSettings } from '@/types';
import { type ReactNode } from 'react';

export function PrintClinicHeader({
    clinic,
    title,
    reference,
    date,
}: {
    clinic: ClinicSettings;
    title: string;
    reference?: string | null;
    date?: string | null;
}) {
    return (
        <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-5">
            <div className="flex items-start gap-4">
                {clinic.logo_url && (
                    <img
                        src={clinic.logo_url}
                        alt={clinic.clinic_name}
                        className="size-16 object-contain"
                    />
                )}
                <div>
                    <p className="text-sm font-semibold tracking-[0.2em] uppercase">
                        {clinic.clinic_name}
                    </p>
                    {clinic.clinic_address && (
                        <p className="mt-1 max-w-md text-xs">
                            {clinic.clinic_address}
                        </p>
                    )}
                    <p className="mt-1 text-xs">
                        {[clinic.contact_number, clinic.email]
                            .filter(Boolean)
                            .join(' | ')}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold">{title}</h1>
                </div>
            </div>
            {(reference || date) && (
                <div className="text-right">
                    {reference && <p className="font-bold">{reference}</p>}
                    {date && <p className="text-sm">{date}</p>}
                </div>
            )}
        </header>
    );
}

export function PrintFooter({ children }: { children: ReactNode }) {
    if (!children) {
        return null;
    }

    return (
        <p className="border-t border-black pt-3 text-center text-xs whitespace-pre-wrap">
            {children}
        </p>
    );
}
