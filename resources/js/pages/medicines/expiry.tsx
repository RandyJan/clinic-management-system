import MedicineController from '@/actions/App/Http/Controllers/MedicineController';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index as medicinesIndex } from '@/routes/medicines';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { MedicinesPagination } from './helpers';
import { MedicinesTable } from './index';
import { PaginatedMedicines } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Medicines', href: medicinesIndex().url },
    { title: 'Expiry Report', href: MedicineController.expiry().url },
];

export default function ExpiryReport({
    medicines,
    expiry_status,
}: {
    medicines: PaginatedMedicines;
    expiry_status: 'near-expiry' | 'expired';
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expiry report" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Expiry report
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {medicines.total} medicines found
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={expiry_status}
                            onValueChange={(value) =>
                                router.get(
                                    MedicineController.expiry().url,
                                    { expiry_status: value },
                                    { preserveScroll: true, replace: true },
                                )
                            }
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="near-expiry">
                                    Near expiry
                                </SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" asChild>
                            <Link href={medicinesIndex().url}>
                                <ArrowLeft />
                                Back
                            </Link>
                        </Button>
                    </div>
                </div>
                <MedicinesTable medicines={medicines} />
                <MedicinesPagination medicines={medicines} />
            </div>
        </AppLayout>
    );
}
