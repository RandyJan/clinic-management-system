import MedicineController from '@/actions/App/Http/Controllers/MedicineController';
import InputError from '@/components/input-error';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as medicinesIndex } from '@/routes/medicines';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type FormEvent } from 'react';
import { Medicine } from './types';

type StockFormData = {
    transaction_type: string;
    quantity: string;
    remarks: string;
};

export default function MedicineStock({
    medicine,
    transaction_types,
}: {
    medicine: Medicine;
    transaction_types: string[];
}) {
    const form = useForm<StockFormData>({
        transaction_type: 'Stock In',
        quantity: '0',
        remarks: '',
    });
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medicines', href: medicinesIndex().url },
        {
            title: 'Stock Adjustment',
            href: MedicineController.stock(medicine.id).url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(MedicineController.updateStock(medicine.id).url, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock adjustment" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock adjustment
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

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>Transaction type</Label>
                            <Select
                                value={form.data.transaction_type}
                                onValueChange={(value) =>
                                    form.setData('transaction_type', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {transaction_types.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={form.errors.transaction_type}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                value={form.data.quantity}
                                onChange={(event) =>
                                    form.setData('quantity', event.target.value)
                                }
                            />
                            <InputError message={form.errors.quantity} />
                        </div>
                        <div className="grid gap-2 md:col-span-3">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea
                                id="remarks"
                                value={form.data.remarks}
                                onChange={(event) =>
                                    form.setData('remarks', event.target.value)
                                }
                            />
                            <InputError message={form.errors.remarks} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save adjustment'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
