import BillingController from '@/actions/App/Http/Controllers/BillingController';
import {
    PrintClinicHeader,
    PrintFooter,
} from '@/components/print-clinic-header';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { formatDate, money } from './helpers';
import { BillingDetail } from './types';

export default function BillingReceipt({
    billing,
    payment_id,
}: {
    billing: BillingDetail;
    payment_id: number;
}) {
    const { clinic } = usePage<SharedData>().props;
    const payment =
        billing.payments.find((payment) => payment.id === payment_id) ??
        billing.payments[0];

    return (
        <>
            <Head title={`${billing.invoice_number} receipt`} />
            <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 bg-white p-8 text-black print:max-w-none print:p-0">
                <div className="flex justify-between gap-3 print:hidden">
                    <Button variant="outline" asChild>
                        <Link href={BillingController.show(billing.id).url}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer />
                        Print receipt
                    </Button>
                </div>
                <PrintClinicHeader
                    clinic={clinic}
                    title="Payment Receipt"
                    reference={billing.invoice_number}
                    date={formatDate(payment.payment_date)}
                />
                <section className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <p className="text-xs font-semibold uppercase">
                            Patient
                        </p>
                        <p className="mt-1 text-lg font-bold">
                            {billing.patient.full_name}
                        </p>
                        <p>{billing.patient.patient_code}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase">
                            Payment
                        </p>
                        <p className="mt-1 text-lg font-bold">
                            {payment.payment_reference}
                        </p>
                        <p>{payment.payment_method}</p>
                        <p>Received by {payment.received_by ?? 'Cashier'}</p>
                    </div>
                </section>
                <section className="grid gap-2 rounded border border-black p-4 text-sm">
                    <Line
                        label="Grand total"
                        value={money(billing.grand_total)}
                    />
                    <Line
                        label="Amount paid"
                        value={money(payment.amount_paid)}
                    />
                    <Line label="Change" value={money(payment.change_amount)} />
                    <Line
                        label="Remaining balance"
                        value={money(billing.balance_due)}
                    />
                    <Line label="Status" value={billing.payment_status} />
                </section>
                <section>
                    <p className="mb-3 text-xs font-semibold uppercase">
                        Items
                    </p>
                    <div className="grid gap-2 text-sm">
                        {billing.items.map((item) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-[1fr_6rem] gap-3 border-b pb-2"
                            >
                                <div>
                                    <p className="font-medium">
                                        {item.description}
                                    </p>
                                    <p>
                                        {item.quantity} x{' '}
                                        {money(item.unit_price)}
                                    </p>
                                </div>
                                <p className="text-right">
                                    {money(item.total_price)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
                <footer className="mt-auto pt-16 text-center text-sm">
                    <div className="mx-auto max-w-xs border-t border-black pt-2">
                        Cashier signature
                    </div>
                    <div className="mt-12">
                        <PrintFooter>{clinic.receipt_footer}</PrintFooter>
                    </div>
                </footer>
            </main>
        </>
    );
}

function Line({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span>{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
