import PrescriptionController from '@/actions/App/Http/Controllers/PrescriptionController';
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
import { Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent } from 'react';
import {
    MedicineOption,
    PrescriptionConsultation,
    PrescriptionFormData,
    PrescriptionFormItem,
} from './types';

const emptyItem = (): PrescriptionFormItem => ({
    medicine_id: '',
    medicine_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '1',
    instructions: '',
});

export default function CreatePrescription({
    consultation,
    medicines,
}: {
    consultation: PrescriptionConsultation;
    medicines: MedicineOption[];
}) {
    const form = useForm<PrescriptionFormData>({
        consultation_id: consultation.id,
        patient_id: consultation.patient_id,
        doctor_id: consultation.doctor_id,
        notes: '',
        items: [emptyItem()],
    });
    const errors = form.errors as Record<string, string>;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Prescriptions', href: PrescriptionController.index().url },
        {
            title: 'Create',
            href: PrescriptionController.create(consultation.id).url,
        },
    ];

    function updateItem(index: number, changes: Partial<PrescriptionFormItem>) {
        form.setData(
            'items',
            form.data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...changes } : item,
            ),
        );
    }

    function chooseMedicine(index: number, selected: string) {
        if (selected === 'custom') {
            updateItem(index, { medicine_id: '', medicine_name: '' });
            return;
        }
        const medicine = medicines.find(
            (option) => option.id.toString() === selected,
        );
        updateItem(index, {
            medicine_id: selected,
            medicine_name: medicine?.name ?? '',
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(PrescriptionController.store().url, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create prescription" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Create prescription
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {consultation.consultation_number} ·{' '}
                        {consultation.patient.full_name} · Dr.{' '}
                        {consultation.doctor.full_name}
                    </p>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Prescription information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <Detail
                                label="Patient"
                                value={`${consultation.patient.full_name} (${consultation.patient.patient_code})`}
                            />
                            <Detail
                                label="Doctor"
                                value={`Dr. ${consultation.doctor.full_name}`}
                            />
                            <Detail
                                label="Consultation"
                                value={consultation.consultation_number}
                            />
                            <div className="sm:col-span-3">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={form.data.notes}
                                    onChange={(event) =>
                                        form.setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2"
                                />
                                <InputError message={form.errors.notes} />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Medicines</h2>
                            <p className="text-sm text-muted-foreground">
                                Select inventory stock or enter a custom
                                medicine.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                form.setData('items', [
                                    ...form.data.items,
                                    emptyItem(),
                                ])
                            }
                        >
                            <Plus />
                            Add medicine
                        </Button>
                    </div>
                    <InputError message={form.errors.items} />
                    <div className="flex flex-col gap-4">
                        {form.data.items.map((item, index) => (
                            <Card key={index}>
                                <CardHeader className="flex-row items-center justify-between">
                                    <CardTitle className="text-base">
                                        Medicine {index + 1}
                                    </CardTitle>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={form.data.items.length === 1}
                                        onClick={() =>
                                            form.setData(
                                                'items',
                                                form.data.items.filter(
                                                    (_, itemIndex) =>
                                                        itemIndex !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 />
                                        <span className="sr-only">
                                            Remove medicine
                                        </span>
                                    </Button>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <Field label="Medicine">
                                        <Select
                                            value={item.medicine_id || 'custom'}
                                            onValueChange={(selected) =>
                                                chooseMedicine(index, selected)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="custom">
                                                    Custom medicine
                                                </SelectItem>
                                                {medicines.map((medicine) => (
                                                    <SelectItem
                                                        key={medicine.id}
                                                        value={medicine.id.toString()}
                                                    >
                                                        {medicine.name} ·{' '}
                                                        {
                                                            medicine.stock_quantity
                                                        }{' '}
                                                        {medicine.unit}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                errors[
                                                    `items.${index}.medicine_id`
                                                ]
                                            }
                                        />
                                    </Field>
                                    {!item.medicine_id && (
                                        <Field label="Custom medicine name">
                                            <Input
                                                value={item.medicine_name}
                                                onChange={(event) =>
                                                    updateItem(index, {
                                                        medicine_name:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        `items.${index}.medicine_name`
                                                    ]
                                                }
                                            />
                                        </Field>
                                    )}
                                    <Field label="Dosage">
                                        <Input
                                            value={item.dosage}
                                            placeholder="e.g. 1 tablet"
                                            onChange={(event) =>
                                                updateItem(index, {
                                                    dosage: event.target.value,
                                                })
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[`items.${index}.dosage`]
                                            }
                                        />
                                    </Field>
                                    <Field label="Frequency">
                                        <Input
                                            value={item.frequency}
                                            placeholder="e.g. Every 8 hours"
                                            onChange={(event) =>
                                                updateItem(index, {
                                                    frequency:
                                                        event.target.value,
                                                })
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `items.${index}.frequency`
                                                ]
                                            }
                                        />
                                    </Field>
                                    <Field label="Duration">
                                        <Input
                                            value={item.duration}
                                            placeholder="e.g. 7 days"
                                            onChange={(event) =>
                                                updateItem(index, {
                                                    duration:
                                                        event.target.value,
                                                })
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `items.${index}.duration`
                                                ]
                                            }
                                        />
                                    </Field>
                                    <Field label="Quantity">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(event) =>
                                                updateItem(index, {
                                                    quantity:
                                                        event.target.value,
                                                })
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `items.${index}.quantity`
                                                ]
                                            }
                                        />
                                    </Field>
                                    <div className="md:col-span-2 xl:col-span-3">
                                        <Label>Instructions</Label>
                                        <Textarea
                                            value={item.instructions}
                                            placeholder="Optional administration instructions"
                                            onChange={(event) =>
                                                updateItem(index, {
                                                    instructions:
                                                        event.target.value,
                                                })
                                            }
                                            className="mt-2"
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `items.${index}.instructions`
                                                ]
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing
                                ? 'Creating…'
                                : 'Create prescription'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid content-start gap-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}
