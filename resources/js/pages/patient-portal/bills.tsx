import BillingController from '@/actions/App/Http/Controllers/BillingController';
import PatientPortalController from '@/actions/App/Http/Controllers/PatientPortalController';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ReceiptText } from 'lucide-react';
import {
    DownloadButton,
    EmptyState,
    formatDate,
    money,
    PortalHeader,
    PortalPagination,
    StatusBadge,
} from './partials';
import { PortalBillsProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
    { title: 'My Bills', href: PatientPortalController.bills().url },
];

export default function PatientPortalBills({ billings }: PortalBillsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Bills" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title="My bills"
                    description={`${billings.total} billing records`}
                />

                {billings.data.length === 0 ? (
                    <EmptyState description="No billing records are available yet." />
                ) : (
                    <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Receipts</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billings.data.map((billing) => (
                                    <TableRow key={billing.id}>
                                        <TableCell className="font-medium">
                                            <div>{billing.invoice_number}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(billing.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {money(billing.grand_total)}
                                        </TableCell>
                                        <TableCell>
                                            {money(billing.amount_paid)}
                                        </TableCell>
                                        <TableCell>
                                            {money(billing.balance_due)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={billing.payment_status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {billing.payments.length ===
                                                0 ? (
                                                    <span className="text-sm text-muted-foreground">
                                                        No receipts
                                                    </span>
                                                ) : (
                                                    billing.payments.map(
                                                        (payment) => (
                                                            <DownloadButton
                                                                key={payment.id}
                                                                href={
                                                                    BillingController.receipt(
                                                                        [
                                                                            billing.id,
                                                                            payment.id,
                                                                        ],
                                                                    ).url
                                                                }
                                                            >
                                                                <ReceiptText />
                                                                {
                                                                    payment.payment_reference
                                                                }
                                                            </DownloadButton>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <PortalPagination pagination={billings} />
            </div>
        </AppLayout>
    );
}
