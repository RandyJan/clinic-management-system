import DoctorController from '@/actions/App/Http/Controllers/DoctorController';
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
import { index as doctorsIndex } from '@/routes/doctors';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Eye, PencilLine, Plus, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Doctor } from './types';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedDoctors = {
    data: Doctor[];
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
    specialization?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Doctors',
        href: doctorsIndex().url,
    },
];

export default function DoctorsIndex({
    doctors,
    filters,
    specializations,
}: {
    doctors: PaginatedDoctors;
    filters: Filters;
    specializations: string[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [specialization, setSpecialization] = useState(
        filters.specialization ?? 'all',
    );

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            doctorsIndex().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
                specialization:
                    specialization === 'all' ? undefined : specialization,
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
            <Head title="Doctors" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Doctors</h1>
                        <p className="text-sm text-muted-foreground">
                            {doctors.total} doctor profiles
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                        <form
                            onSubmit={submitFilters}
                            className="flex flex-col gap-2 lg:flex-row lg:items-end"
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="doctor-search">Search</Label>
                                <Input
                                    id="doctor-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="lg:w-72"
                                    placeholder="Name, code, license, contact"
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
                                    <SelectTrigger className="w-full lg:w-36">
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
                            <div className="grid gap-1">
                                <Label>Specialization</Label>
                                <Select
                                    value={specialization}
                                    onValueChange={setSpecialization}
                                >
                                    <SelectTrigger className="w-full lg:w-52">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {specializations.map((option) => (
                                            <SelectItem
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit">
                                <Search />
                                Search
                            </Button>
                        </form>

                        <Button asChild>
                            <Link href={DoctorController.create().url}>
                                <Plus />
                                Create doctor
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Specialization</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Linked account</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctors.data.map((doctor) => (
                                <TableRow key={doctor.id}>
                                    <TableCell className="min-w-56">
                                        <div className="font-medium">
                                            {doctor.full_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {doctor.license_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>{doctor.doctor_code}</TableCell>
                                    <TableCell>{doctor.specialization}</TableCell>
                                    <TableCell>
                                        {formatCurrency(
                                            doctor.consultation_fee,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={doctor.status} />
                                    </TableCell>
                                    <TableCell>
                                        {doctor.user?.name ?? 'Not linked'}
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
                                                        DoctorController.show(
                                                            doctor.id,
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
                                                        DoctorController.schedule(
                                                            doctor.id,
                                                        ).url
                                                    }
                                                >
                                                    <CalendarDays />
                                                    Schedule
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={
                                                        DoctorController.edit(
                                                            doctor.id,
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
                            {doctors.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No doctors found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <DoctorsPagination doctors={doctors} />
            </div>
        </AppLayout>
    );
}

function DoctorsPagination({ doctors }: { doctors: PaginatedDoctors }) {
    if (doctors.links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {doctors.from ?? 0} to {doctors.to ?? 0} of{' '}
                {doctors.total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                {doctors.links.map((link, index) =>
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

export function StatusBadge({ status }: { status: Doctor['status'] }) {
    return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
    );
}

export function formatCurrency(value: string | number) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));
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

