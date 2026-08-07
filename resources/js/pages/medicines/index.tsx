import MedicineController from '@/actions/App/Http/Controllers/MedicineController';
import { Button } from '@/components/ui/button';
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
import { index as medicinesIndex } from '@/routes/medicines';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, PencilLine, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import {
    formatCurrency,
    formatDate,
    MedicinesPagination,
    StatusBadge,
} from './helpers';
import { type MedicineStatus, type PaginatedMedicines } from './types';

type Filters = {
    search?: string;
    category?: string;
    status?: MedicineStatus;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Medicines', href: medicinesIndex().url },
];

export default function MedicinesIndex({
    medicines,
    filters,
    categories,
}: {
    medicines: PaginatedMedicines;
    filters: Filters;
    categories: string[];
    statuses: MedicineStatus[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            medicinesIndex().url,
            {
                search: search || undefined,
                category: category === 'all' ? undefined : category,
                status: status === 'all' ? undefined : status,
            },
            { preserveScroll: true, preserveState: false, replace: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Medicines" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Medicines</h1>
                        <p className="text-sm text-muted-foreground">
                            {medicines.total} inventory items
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                        <form
                            onSubmit={submitFilters}
                            className="flex flex-col gap-2 lg:flex-row lg:items-end"
                        >
                            <div className="grid gap-1">
                                <Label htmlFor="medicine-search">Search</Label>
                                <Input
                                    id="medicine-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="lg:w-72"
                                    placeholder="Code, name, generic, brand"
                                />
                            </div>
                            <SelectFilter
                                label="Category"
                                value={category}
                                values={categories}
                                onChange={setCategory}
                            />
                            <div className="grid gap-1">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
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
                            <Button type="submit">
                                <Search />
                                Search
                            </Button>
                        </form>

                        <Button asChild>
                            <Link href={MedicineController.create().url}>
                                <Plus />
                                Add medicine
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                        <Link href={MedicineController.lowStock().url}>
                            <SlidersHorizontal />
                            Low stock
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={MedicineController.expiry().url}>
                            <ClipboardList />
                            Expiry report
                        </Link>
                    </Button>
                </div>

                <MedicinesTable medicines={medicines} />
                <MedicinesPagination medicines={medicines} />
            </div>
        </AppLayout>
    );
}

export function MedicinesTable({
    medicines,
}: {
    medicines: PaginatedMedicines;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {medicines.data.map((medicine) => (
                        <TableRow key={medicine.id}>
                            <TableCell className="min-w-64">
                                <div className="font-medium">
                                    {medicine.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {medicine.medicine_code}
                                </div>
                            </TableCell>
                            <TableCell>{medicine.category ?? 'Other'}</TableCell>
                            <TableCell>
                                {medicine.current_stock} {medicine.unit}
                                <div className="text-xs text-muted-foreground">
                                    Reorder at {medicine.reorder_level}
                                </div>
                            </TableCell>
                            <TableCell>{formatDate(medicine.expiry_date)}</TableCell>
                            <TableCell>
                                {formatCurrency(medicine.selling_price)}
                            </TableCell>
                            <TableCell>
                                <StatusBadge medicine={medicine} />
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={
                                                MedicineController.stock(
                                                    medicine.id,
                                                ).url
                                            }
                                        >
                                            Stock
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={
                                                MedicineController.transactions(
                                                    medicine.id,
                                                ).url
                                            }
                                        >
                                            History
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={
                                                MedicineController.edit(
                                                    medicine.id,
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
                    {medicines.data.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="h-24 text-center text-muted-foreground"
                            >
                                No medicines found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function SelectFilter({
    label,
    value,
    values,
    onChange,
}: {
    label: string;
    value: string;
    values: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-1">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full lg:w-48">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {values.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
