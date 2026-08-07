import BillingController from '@/actions/App/Http/Controllers/BillingController';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { formatDate, money, statusVariant } from './helpers';
import { PaginatedBillings, PaymentStatus } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: BillingController.index().url },
];

export default function BillingIndex({
    billings,
    filters,
    statuses,
}: {
    billings: PaginatedBillings;
    filters: { search?: string; status?: string };
    statuses: PaymentStatus[];
}) {
    const permissions = new Set(
        usePage<SharedData>().props.auth.permissions ?? [],
    );
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(
            BillingController.index().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Billing</h1>
                        <p className="text-sm text-muted-foreground">
                            Invoices, payment status, and receipts.
                        </p>
                    </div>
                    {permissions.has('billing.create') && (
                        <Button asChild>
                            <Link href={BillingController.create().url}>
                                <Plus />
                                Create bill
                            </Link>
                        </Button>
                    )}
                </div>

                <form
                    onSubmit={submit}
                    className="flex flex-col gap-2 sm:flex-row"
                >
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search invoice, patient, or code"
                        className="sm:max-w-md"
                    />
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="sm:w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="submit">
                        <Search />
                        Search
                    </Button>
                </form>

                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billings.data.map((billing) => (
                                <TableRow key={billing.id}>
                                    <TableCell className="font-medium">
                                        {billing.invoice_number}
                                    </TableCell>
                                    <TableCell>
                                        <p>{billing.patient.full_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {billing.patient.patient_code}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={statusVariant(
                                                billing.payment_status,
                                            )}
                                        >
                                            {billing.payment_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {money(billing.grand_total)}
                                    </TableCell>
                                    <TableCell>
                                        {money(billing.amount_paid)}
                                    </TableCell>
                                    <TableCell>
                                        {money(billing.balance_due)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(billing.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link
                                                href={
                                                    BillingController.show(
                                                        billing.id,
                                                    ).url
                                                }
                                            >
                                                <Eye />
                                                View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {billings.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No billing records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {billings.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Showing {billings.from ?? 0} to {billings.to ?? 0}{' '}
                            of {billings.total}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {billings.links.map((link, index) =>
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
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
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
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
