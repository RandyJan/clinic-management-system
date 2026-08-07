import BillingController from '@/actions/App/Http/Controllers/BillingController';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Ban, CreditCard, FilePenLine, Printer } from 'lucide-react';
import { formatDate, money, statusVariant } from './helpers';
import { BillingDetail } from './types';

export default function BillingShow({ billing }: { billing: BillingDetail }) {
    const permissions = new Set(
        usePage<SharedData>().props.auth.permissions ?? [],
    );
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: BillingController.index().url },
        {
            title: billing.invoice_number,
            href: BillingController.show(billing.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={billing.invoice_number} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-semibold">
                                {billing.invoice_number}
                            </h1>
                            <Badge
                                variant={statusVariant(billing.payment_status)}
                            >
                                {billing.payment_status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Created {formatDate(billing.created_at)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {permissions.has('billing.update') &&
                            (billing.payment_status !== 'Paid' ||
                                permissions.has('billing.admin')) &&
                            billing.payment_status !== 'Cancelled' && (
                                <Button variant="outline" asChild>
                                    <Link
                                        href={
                                            BillingController.edit(billing.id)
                                                .url
                                        }
                                    >
                                        <FilePenLine />
                                        Edit
                                    </Link>
                                </Button>
                            )}
                        {permissions.has('billing.payments.create') &&
                            !['Paid', 'Cancelled'].includes(
                                billing.payment_status,
                            ) && (
                                <Button asChild>
                                    <Link
                                        href={
                                            BillingController.payment(
                                                billing.id,
                                            ).url
                                        }
                                    >
                                        <CreditCard />
                                        Record payment
                                    </Link>
                                </Button>
                            )}
                        {billing.payments[0] && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={
                                        BillingController.receipt({
                                            billing: billing.id,
                                            payment: billing.payments[0].id,
                                        }).url
                                    }
                                >
                                    <Printer />
                                    Latest receipt
                                </Link>
                            </Button>
                        )}
                        {permissions.has('billing.cancel') &&
                            billing.payment_status !== 'Cancelled' && (
                                <CancelBillingButton billing={billing} />
                            )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <InfoCard
                        title="Patient"
                        lines={[
                            billing.patient.full_name,
                            billing.patient.patient_code,
                        ]}
                    />
                    <InfoCard
                        title="Source"
                        lines={[
                            billing.appointment?.appointment_number ??
                                'No appointment linked',
                            billing.consultation?.consultation_number ??
                                'No consultation linked',
                        ]}
                    />
                    <InfoCard
                        title="Totals"
                        lines={[
                            `Grand total: ${money(billing.grand_total)}`,
                            `Paid: ${money(billing.amount_paid)}`,
                            `Balance: ${money(billing.balance_due)}`,
                        ]}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Billing items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Unit price</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {billing.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.item_type}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.description}
                                            </TableCell>
                                            <TableCell>
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell>
                                                {money(item.unit_price)}
                                            </TableCell>
                                            <TableCell>
                                                {money(item.total_price)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                {billing.payments.map((payment) => (
                                    <Link
                                        key={payment.id}
                                        href={
                                            BillingController.receipt({
                                                billing: billing.id,
                                                payment: payment.id,
                                            }).url
                                        }
                                        className="grid gap-1 rounded-md border p-3 text-sm transition hover:bg-muted"
                                    >
                                        <span className="font-medium">
                                            {payment.payment_reference} -{' '}
                                            {money(payment.amount_paid)}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {payment.payment_method} -{' '}
                                            {formatDate(payment.payment_date)}
                                        </span>
                                    </Link>
                                ))}
                                {billing.payments.length === 0 && (
                                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        No payments recorded.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm">
                            <Line
                                label="Subtotal"
                                value={money(billing.total_amount)}
                            />
                            <Line
                                label="Discount"
                                value={money(billing.discount)}
                            />
                            <Line label="Tax" value={money(billing.tax)} />
                            <Line
                                label="Grand total"
                                value={money(billing.grand_total)}
                                strong
                            />
                        </CardContent>
                    </Card>
                </div>

                {billing.payment_status === 'Cancelled' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Cancellation remarks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">
                                {billing.cancelled_remarks}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

function CancelBillingButton({ billing }: { billing: BillingDetail }) {
    const form = useForm({ remarks: '' });

    function cancel() {
        form.patch(BillingController.cancel(billing.id).url, {
            preserveScroll: true,
        });
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <Ban />
                    Cancel
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel invoice</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cancelled bills require remarks and cannot receive
                        payments.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={form.data.remarks}
                    onChange={(event) =>
                        form.setData('remarks', event.target.value)
                    }
                    placeholder="Reason for cancellation"
                />
                <InputError message={form.errors.remarks} />
                <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={cancel}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        Cancel invoice
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
                {lines.map((line, index) => (
                    <p
                        key={`${title}-${index}`}
                        className={
                            index === 0
                                ? 'font-medium'
                                : 'text-muted-foreground'
                        }
                    >
                        {line}
                    </p>
                ))}
            </CardContent>
        </Card>
    );
}

function Line({
    label,
    value,
    strong,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className={strong ? 'font-semibold' : ''}>{value}</span>
        </div>
    );
}
