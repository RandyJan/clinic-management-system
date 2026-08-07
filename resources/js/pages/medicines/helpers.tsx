import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Medicine, PaginatedMedicines } from './types';

export function formatCurrency(value: string | number) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));
}

export function formatDate(value: string | null | undefined) {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(value));
}

export function StatusBadge({ medicine }: { medicine: Medicine }) {
    if (medicine.status === 'inactive') {
        return <Badge variant="secondary">Inactive</Badge>;
    }

    if (medicine.is_expired) {
        return <Badge variant="destructive">Expired</Badge>;
    }

    if (medicine.is_low_stock) {
        return <Badge variant="outline">Low stock</Badge>;
    }

    if (medicine.is_near_expiry) {
        return <Badge variant="outline">Near expiry</Badge>;
    }

    return <Badge>Active</Badge>;
}

export function MedicinesPagination({
    medicines,
}: {
    medicines: PaginatedMedicines;
}) {
    if (medicines.links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {medicines.from ?? 0} to {medicines.to ?? 0} of{' '}
                {medicines.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {medicines.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                buttonVariants({
                                    variant: link.active
                                        ? 'default'
                                        : 'outline',
                                    size: 'sm',
                                }),
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'sm',
                                }),
                                'pointer-events-none opacity-50',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </div>
    );
}
