import MedicalRecordController from '@/actions/App/Http/Controllers/MedicalRecordController';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { PaginatedMedicalRecords } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Medical records', href: MedicalRecordController.index().url },
];

export default function MedicalRecordsIndex({
    records,
    filters,
}: {
    records: PaginatedMedicalRecords;
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            MedicalRecordController.index().url,
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Medical records" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Medical records</h1>
                    <p className="text-sm text-muted-foreground">
                        Search and review authorized patient clinical histories.
                    </p>
                </div>
                <form
                    onSubmit={submit}
                    className="flex max-w-xl flex-col gap-2 sm:flex-row"
                >
                    <Input
                        name="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search patient name or patient code"
                    />
                    <Button type="submit">
                        <Search />
                        Search
                    </Button>
                </form>
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Age</TableHead>
                                <TableHead>Consultations</TableHead>
                                <TableHead>Vital records</TableHead>
                                <TableHead>Last consultation</TableHead>
                                <TableHead className="text-right">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.data.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <p className="font-medium">
                                            {record.full_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground capitalize">
                                            {record.gender}
                                        </p>
                                    </TableCell>
                                    <TableCell>{record.patient_code}</TableCell>
                                    <TableCell>{record.age ?? '—'}</TableCell>
                                    <TableCell>
                                        {record.consultations_count}
                                    </TableCell>
                                    <TableCell>
                                        {record.vital_signs_count}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(
                                            record.last_consultation_at,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={
                                                    MedicalRecordController.show(
                                                        record.id,
                                                    ).url
                                                }
                                            >
                                                <Eye />
                                                View record
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {records.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No authorized medical records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {records.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Showing {records.from ?? 0} to {records.to ?? 0} of{' '}
                            {records.total}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {records.links.map((link, index) =>
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

function formatDate(value: string | null) {
    return value
        ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
              new Date(value),
          )
        : 'None';
}
