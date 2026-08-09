import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

type PaginationPayload = {
    from: number | null;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export function PortalHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-1">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {action}
        </div>
    );
}

export function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    icon: LucideIcon;
}) {
    return (
        <Card className="gap-3 py-4">
            <CardHeader className="flex-row items-start justify-between gap-3 px-4">
                <div className="grid gap-1">
                    <CardTitle className="text-sm text-muted-foreground">
                        {label}
                    </CardTitle>
                    <div className="text-2xl font-semibold tabular-nums">
                        {typeof value === 'number' ? number(value) : value}
                    </div>
                </div>
                <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <Icon className="size-4" />
                </div>
            </CardHeader>
        </Card>
    );
}

export function EmptyState({
    title = 'No records found',
    description,
}: {
    title?: string;
    description: string;
}) {
    return (
        <div className="rounded-lg border border-dashed border-sidebar-border/70 p-8 text-center dark:border-sidebar-border">
            <div className="font-medium">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

export function PortalPagination({
    pagination,
}: {
    pagination: PaginationPayload;
}) {
    if (pagination.links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {pagination.from ?? 0} to {pagination.to ?? 0} of{' '}
                {pagination.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {pagination.links.map((link, index) =>
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

export function StatusBadge({ status }: { status: string }) {
    const className = statusClass(status);

    return <Badge className={className}>{status}</Badge>;
}

export function DownloadButton({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Button variant="outline" size="sm" asChild>
            <a href={href} target="_blank" rel="noreferrer">
                {children}
            </a>
        </Button>
    );
}

export function formatDate(value: string | null | undefined) {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(value.includes('T') ? value : `${value}T00:00:00`));
}

export function formatTime(value: string | null | undefined) {
    if (!value) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat(undefined, {
        timeStyle: 'short',
    }).format(new Date(`1970-01-01T${value}`));
}

export function money(value: number) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}

function number(value: number) {
    return new Intl.NumberFormat().format(value);
}

function statusClass(status: string) {
    if (
        ['Paid', 'Completed', 'Dispensed', 'Confirmed', 'Active'].includes(
            status,
        )
    ) {
        return 'bg-emerald-600 text-white hover:bg-emerald-600';
    }

    if (
        ['Pending', 'Partially Paid', 'In Progress', 'Checked-in'].includes(
            status,
        )
    ) {
        return 'bg-amber-600 text-white hover:bg-amber-600';
    }

    if (['Cancelled', 'No-show', 'Inactive'].includes(status)) {
        return 'bg-red-600 text-white hover:bg-red-600';
    }

    return 'bg-slate-600 text-white hover:bg-slate-600';
}
