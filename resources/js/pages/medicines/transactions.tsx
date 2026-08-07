import MedicineController from '@/actions/App/Http/Controllers/MedicineController';
import { Button } from '@/components/ui/button';
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
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from './helpers';
import { Medicine, PaginatedStockTransactions } from './types';

export default function MedicineTransactions({
    medicine,
    transactions,
}: {
    medicine: Medicine;
    transactions: PaginatedStockTransactions;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medicines', href: medicinesIndex().url },
        {
            title: 'Stock History',
            href: MedicineController.transactions(medicine.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock transaction history" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock transaction history
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {medicine.name} · {medicine.current_stock}{' '}
                            {medicine.unit} on hand
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={medicinesIndex().url}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Previous</TableHead>
                                <TableHead>New</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead>Created by</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.data.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        {transaction.transaction_type}
                                    </TableCell>
                                    <TableCell>{transaction.quantity}</TableCell>
                                    <TableCell>
                                        {transaction.previous_stock}
                                    </TableCell>
                                    <TableCell>{transaction.new_stock}</TableCell>
                                    <TableCell className="max-w-72 truncate">
                                        {transaction.remarks ?? 'None'}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.created_by ?? 'System'}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(transaction.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {transactions.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No stock movements recorded.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
