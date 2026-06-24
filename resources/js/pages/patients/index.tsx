import PatientController from '@/actions/App/Http/Controllers/PatientController';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { index as patientsIndex } from '@/routes/patients';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, PencilLine, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Patient } from './types';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedPatients = {
    data: Patient[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Filters = {
    search?: string;
    status?: 'active' | 'inactive';
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Patients',
        href: patientsIndex().url,
    },
];

export default function PatientsIndex({
    patients,
    filters,
}: {
    patients: PaginatedPatients;
    filters: Filters;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            patientsIndex().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patients" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Patients</h1>
                        <p className="text-sm text-muted-foreground">
                            {patients.total} patient records
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <form
                            onSubmit={submitFilters}
                            className="flex flex-col gap-2 sm:flex-row sm:items-end"
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="patient-search">Search</Label>
                                <Input
                                    id="patient-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="sm:w-72"
                                    placeholder="Name, code, contact, email"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(
                                            value as
                                                | 'all'
                                                | 'active'
                                                | 'inactive',
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full sm:w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit">
                                <Search />
                                Search
                            </Button>
                        </form>

                        <Button asChild>
                            <Link href={PatientController.create().url}>
                                <Plus />
                                Register patient
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.data.map((patient) => (
                                <TableRow key={patient.id}>
                                    <TableCell className="min-w-56">
                                        <div className="font-medium">
                                            {patient.full_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {patient.email ?? 'No email'}
                                        </div>
                                    </TableCell>
                                    <TableCell>{patient.patient_code}</TableCell>
                                    <TableCell>
                                        {patient.age ?? 'Not available'}
                                    </TableCell>
                                    <TableCell>{patient.contact_number}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={patient.status} />
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(patient.updated_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={
                                                        PatientController.show(
                                                            patient.id,
                                                        ).url
                                                    }
                                                >
                                                    <Eye />
                                                    View
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={
                                                        PatientController.edit(
                                                            patient.id,
                                                        ).url
                                                    }
                                                >
                                                    <PencilLine />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {patients.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No patients found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <PatientsPagination patients={patients} />
            </div>
        </AppLayout>
    );
}

function PatientsPagination({ patients }: { patients: PaginatedPatients }) {
    if (patients.links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {patients.from ?? 0} to {patients.to ?? 0} of{' '}
                {patients.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {patients.links.map((link, index) =>
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

export function StatusBadge({ status }: { status: Patient['status'] }) {
    return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
    );
}

export function formatDate(value: string | null | undefined) {
    if (!value) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

