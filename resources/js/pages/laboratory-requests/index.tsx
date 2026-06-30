import LaboratoryRequestController from '@/actions/App/Http/Controllers/LaboratoryRequestController';
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
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { LabRequestStatus, PaginatedLabRequests } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Laboratory', href: LaboratoryRequestController.index().url },
];

export default function LaboratoryRequestIndex({
    laboratory_requests,
    filters,
}: {
    laboratory_requests: PaginatedLabRequests;
    filters: { search?: string; status?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    function submit(event: FormEvent) {
        event.preventDefault();
        router.get(
            LaboratoryRequestController.index().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
            },
            { preserveState: true, replace: true },
        );
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laboratory requests" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Laboratory requests
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Track requested tests, processing, and completed
                        results.
                    </p>
                </div>
                <form
                    onSubmit={submit}
                    className="flex flex-col gap-2 sm:flex-row"
                >
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search request, patient, or code"
                        className="sm:max-w-md"
                    />
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="sm:w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">
                                In Progress
                            </SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                                <TableHead>Request</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Tests</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead className="text-right">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {laboratory_requests.data.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-medium">
                                        {request.lab_request_number}
                                    </TableCell>
                                    <TableCell>
                                        <p>{request.patient.full_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {request.patient.patient_code}
                                        </p>
                                    </TableCell>
                                    <TableCell className="max-w-64">
                                        <p className="truncate">
                                            {request.requested_tests.join(', ')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {request.requested_tests.length}{' '}
                                            test(s)
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        Dr. {request.doctor.full_name}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={request.status} />
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(request.requested_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link
                                                href={
                                                    LaboratoryRequestController.show(
                                                        request.id,
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
                            {laboratory_requests.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No laboratory requests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {laboratory_requests.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Showing {laboratory_requests.from ?? 0} to{' '}
                            {laboratory_requests.to ?? 0} of{' '}
                            {laboratory_requests.total}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {laboratory_requests.links.map((link, index) =>
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

export function StatusBadge({ status }: { status: LabRequestStatus }) {
    return (
        <Badge
            variant={
                status === 'Completed'
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
