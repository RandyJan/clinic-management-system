import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
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
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { PaginatedPrescriptions, PrescriptionStatus } from './types';

export function PrescriptionList({
    prescriptions,
    filters,
    pendingOnly = false,
    actionUrl,
}: {
    prescriptions: PaginatedPrescriptions;
    filters: { search?: string; status?: string };
    pendingOnly?: boolean;
    actionUrl?: string;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');

    function submit(event: FormEvent) {
        event.preventDefault();
        const target =
            actionUrl ??
            (pendingOnly
                ? PrescriptionController.pending().url
                : PrescriptionController.index().url);
        router.get(
            target,
            {
                search: search || undefined,
                status: pendingOnly || status === 'all' ? undefined : status,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search prescription, patient, or code"
                    className="sm:max-w-md"
                />
                {!pendingOnly && (
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="sm:w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Dispensed">Dispensed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                <Button type="submit">
                    <Search />
                    Search
                </Button>
            </form>
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prescription</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prescriptions.data.map((prescription) => (
                            <TableRow key={prescription.id}>
                                <TableCell className="font-medium">
                                    {prescription.prescription_number}
                                </TableCell>
                                <TableCell>
                                    <p>{prescription.patient.full_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {prescription.patient.patient_code}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    <p>Dr. {prescription.doctor.full_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {prescription.doctor.specialization}
                                    </p>
                                </TableCell>
                                <TableCell>
                                    {prescription.items_count}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={prescription.status} />
                                </TableCell>
                                <TableCell>
                                    {formatDate(prescription.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link
                                            href={
                                                PrescriptionController.show(
                                                    prescription.id,
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
                        {prescriptions.data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No prescriptions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {prescriptions.links.length > 3 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        Showing {prescriptions.from ?? 0} to{' '}
                        {prescriptions.to ?? 0} of {prescriptions.total}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {prescriptions.links.map((link, index) =>
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
    );
}

export function StatusBadge({ status }: { status: PrescriptionStatus }) {
    return (
        <Badge
            variant={
                status === 'Dispensed'
                    ? 'default'
                    : status === 'Cancelled'
                      ? 'destructive'
                      : 'secondary'
            }
        >
            {status}
        </Badge>
    );
}

export function formatDate(value: string | null) {
    return value
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(value))
        : 'Not recorded';
}
