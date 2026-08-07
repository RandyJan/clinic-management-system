import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    index as medicinesIndex,
    lowStock as medicinesLowStock,
} from '@/routes/medicines';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { MedicinesPagination } from './helpers';
import { MedicinesTable } from './index';
import { PaginatedMedicines } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Medicines', href: medicinesIndex().url },
    { title: 'Low Stock', href: medicinesLowStock().url },
];

export default function LowStockReport({
    medicines,
}: {
    medicines: PaginatedMedicines;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Low stock report" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Low stock report
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {medicines.total} medicines at or below reorder
                            level
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={medicinesIndex().url}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                </div>
                <MedicinesTable medicines={medicines} />
                <MedicinesPagination medicines={medicines} />
            </div>
        </AppLayout>
    );
}
