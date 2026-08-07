import BillingController from '@/actions/App/Http/Controllers/BillingController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { FormEvent } from 'react';
import { money } from './helpers';
import { BillingDetail } from './types';

export default function BillingPayment({
    billing,
    payment_methods,
}: {
    billing: BillingDetail;
    payment_methods: string[];
}) {
    const form = useForm({
        payment_method: 'Cash',
        amount_paid: billing.balance_due.toString(),
        remarks: '',
    });
    const tendered = Number(form.data.amount_paid || 0);
    const change = Math.max(tendered - billing.balance_due, 0);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: BillingController.index().url },
        {
            title: billing.invoice_number,
            href: BillingController.show(billing.id).url,
        },
        {
            title: 'Payment',
            href: BillingController.payment(billing.id).url,
        },
    ];

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(BillingController.storePayment(billing.id).url, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${billing.invoice_number} payment`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Record payment</h1>
                    <p className="text-sm text-muted-foreground">
                        {billing.invoice_number} - {billing.patient.full_name}
                    </p>
                </div>
                <form onSubmit={submit} className="grid max-w-3xl gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div className="grid gap-2">
                                <Label>Payment method</Label>
                                <Select
                                    value={form.data.payment_method}
                                    onValueChange={(value) =>
                                        form.setData('payment_method', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {payment_methods.map((method) => (
                                            <SelectItem
                                                key={method}
                                                value={method}
                                            >
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={form.errors.payment_method}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount_paid">Amount paid</Label>
                                <Input
                                    id="amount_paid"
                                    type="number"
                                    step="0.01"
                                    value={form.data.amount_paid}
                                    onChange={(event) =>
                                        form.setData(
                                            'amount_paid',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.amount_paid} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    value={form.data.remarks}
                                    onChange={(event) =>
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.remarks} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="grid gap-2 p-5 text-sm">
                            <Line
                                label="Grand total"
                                value={money(billing.grand_total)}
                            />
                            <Line
                                label="Previously paid"
                                value={money(billing.amount_paid)}
                            />
                            <Line
                                label="Balance due"
                                value={money(billing.balance_due)}
                                strong
                            />
                            <Line label="Change" value={money(change)} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <CreditCard />
                            {form.processing
                                ? 'Recording...'
                                : 'Record payment'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
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
