import PlatformClinicController from '@/actions/App/Http/Controllers/Platform/ClinicController';
import ClinicMembershipController from '@/actions/App/Http/Controllers/Platform/ClinicMembershipController';
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
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, PencilLine, Plus, Search, UsersRound } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { type ClinicStatus, type PaginatedClinics } from './types';

type Filters = { search?: string; status?: ClinicStatus };
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clinics', href: PlatformClinicController.index().url },
];

export default function ClinicsIndex({
    clinics,
    filters,
}: {
    clinics: PaginatedClinics;
    filters: Filters;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState<ClinicStatus | 'all'>(
        filters.status ?? 'all',
    );

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            PlatformClinicController.index().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
            },
            { preserveState: false, replace: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Clinics" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Building2 className="size-6 text-primary" />
                            <h1 className="text-2xl font-semibold">Clinics</h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {clinics.total} registered tenant clinics
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-2 sm:flex-row sm:items-end"
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="clinic-search">Search</Label>
                                <Input
                                    id="clinic-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Name, slug, or email"
                                    className="sm:w-64"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(value as ClinicStatus | 'all')
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
                            <Link href={PlatformClinicController.create()}>
                                <Plus />
                                Create clinic
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-sidebar-border/70">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Clinic</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clinics.data.map((clinic) => (
                                <TableRow key={clinic.id}>
                                    <TableCell>
                                        <p className="font-medium">
                                            {clinic.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {clinic.slug}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <p>{clinic.email ?? 'No email'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {clinic.contact_number ??
                                                'No contact number'}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                clinic.status === 'active'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {clinic.status === 'active'
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            clinic.created_at,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={ClinicMembershipController.index(
                                                        clinic.id,
                                                    )}
                                                >
                                                    <UsersRound />
                                                    Members
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={PlatformClinicController.edit(
                                                        clinic.id,
                                                    )}
                                                >
                                                    <PencilLine />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {clinics.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No clinics found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {clinics.links.length > 3 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {clinics.from ?? 0} to {clinics.to ?? 0} of{' '}
                            {clinics.total}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {clinics.links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={index}
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
                                        key={index}
                                        className={cn(
                                            buttonVariants({
                                                variant: 'outline',
                                                size: 'sm',
                                            }),
                                            'pointer-events-none opacity-45',
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
