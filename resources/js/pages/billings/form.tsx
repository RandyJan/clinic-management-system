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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent } from 'react';
import { money } from './helpers';
import {
    BillingDetail,
    BillingSource,
    PatientOption,
    ServiceOption,
} from './types';

type BillingFormData = {
    patient_id: string;
    appointment_id: string;
    consultation_id: string;
    discount: string;
    tax: string;
    items: Array<{
        service_id: string;
        item_type: string;
        description: string;
        quantity: string;
        unit_price: string;
    }>;
};

const emptyItem = {
    service_id: '',
    item_type: 'Consultation fee',
    description: '',
    quantity: '1',
    unit_price: '0',
};

export default function BillingForm({
    billing,
    source,
    patients,
    services,
    item_types,
}: {
    billing?: BillingDetail;
    source: BillingSource;
    patients: PatientOption[];
    services: ServiceOption[];
    item_types: string[];
}) {
    const { clinic } = usePage<SharedData>().props;
    const isEditing = billing !== undefined;
    const defaultConsultationFee = clinic.consultation_default_fee.toString();
    const initialTax = source.consultation_number
        ? (
              (Number(defaultConsultationFee) * Number(clinic.tax_rate)) /
              100
          ).toFixed(2)
        : '0';
    const form = useForm<BillingFormData>(
        billing
            ? {
                  patient_id: billing.patient_id.toString(),
                  appointment_id: billing.appointment_id?.toString() ?? '',
                  consultation_id: billing.consultation_id?.toString() ?? '',
                  discount: billing.discount.toString(),
                  tax: billing.tax.toString(),
                  items: billing.items.map((item) => ({
                      service_id: item.service_id?.toString() ?? '',
                      item_type: item.item_type,
                      description: item.description,
                      quantity: item.quantity.toString(),
                      unit_price: item.unit_price.toString(),
                  })),
              }
            : {
                  patient_id: source.patient_id?.toString() ?? '',
                  appointment_id: source.appointment_id?.toString() ?? '',
                  consultation_id: source.consultation_id?.toString() ?? '',
                  discount: '0',
                  tax: initialTax,
                  items: [
                      {
                          ...emptyItem,
                          unit_price: source.consultation_number
                              ? defaultConsultationFee
                              : emptyItem.unit_price,
                          description: source.consultation_number
                              ? `Consultation fee - ${source.consultation_number}`
                              : '',
                      },
                  ],
              },
    );
    const errors = form.errors as Record<string, string>;
    const subtotal = form.data.items.reduce(
        (sum, item) =>
            sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0,
    );
    const grandTotal = Math.max(
        subtotal - Number(form.data.discount || 0) + Number(form.data.tax || 0),
        0,
    );
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billing', href: BillingController.index().url },
        {
            title: isEditing ? 'Edit bill' : 'Create bill',
            href: isEditing
                ? BillingController.edit(billing.id).url
                : BillingController.create().url,
        },
    ];

    function submit(event: FormEvent) {
        event.preventDefault();

        if (billing) {
            form.put(BillingController.update(billing.id).url, {
                preserveScroll: true,
            });
            return;
        }

        form.post(BillingController.store().url, { preserveScroll: true });
    }

    function updateItem(
        index: number,
        field: keyof BillingFormData['items'][number],
        value: string,
    ) {
        form.setData(
            'items',
            form.data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    }

    function selectService(index: number, serviceId: string) {
        if (serviceId === 'manual') {
            updateItem(index, 'service_id', '');
            return;
        }

        const service = services.find(
            (option) => option.id.toString() === serviceId,
        );

        if (!service) {
            return;
        }

        form.setData(
            'items',
            form.data.items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          service_id: service.id.toString(),
                          item_type: service.category,
                          description: service.name,
                          unit_price: service.price.toString(),
                      }
                    : item,
            ),
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit bill' : 'Create bill'} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        {isEditing ? 'Edit bill' : 'Create bill'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {billing?.invoice_number ??
                            source.consultation_number ??
                            source.appointment_number ??
                            'Manual billing invoice'}
                    </p>
                </div>

                <form onSubmit={submit} className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing source</CardTitle>
                        </CardHeader>
                        <CardContent className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                            <div className="grid min-w-0 gap-2">
                                <Label>Patient</Label>
                                <Select
                                    value={form.data.patient_id}
                                    onValueChange={(value) =>
                                        form.setData('patient_id', value)
                                    }
                                >
                                    <SelectTrigger className="w-full min-w-0 [&>span]:truncate">
                                        <SelectValue placeholder="Select patient" />
                                    </SelectTrigger>
                                    <SelectContent
                                        position="popper"
                                        className="max-w-[calc(100vw-2rem)]"
                                    >
                                        {patients.map((patient) => (
                                            <SelectItem
                                                key={patient.id}
                                                value={patient.id.toString()}
                                            >
                                                {patient.full_name} (
                                                {patient.patient_code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.patient_id} />
                            </div>
                            <div className="grid min-w-0 gap-3 rounded-md border p-3">
                                <p className="text-sm font-medium">
                                    Source details
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <SourceDetail
                                        label="Appointment"
                                        value={
                                            billing?.appointment
                                                ?.appointment_number ??
                                            source.appointment_number ??
                                            'Not linked'
                                        }
                                    />
                                    <SourceDetail
                                        label="Consultation"
                                        value={
                                            billing?.consultation
                                                ?.consultation_number ??
                                            source.consultation_number ??
                                            'Not linked'
                                        }
                                    />
                                </div>
                                <InputError
                                    message={form.errors.appointment_id}
                                />
                                <InputError
                                    message={form.errors.consultation_id}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Billing items</CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    form.setData('items', [
                                        ...form.data.items,
                                        { ...emptyItem },
                                    ])
                                }
                            >
                                <Plus />
                                Add item
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <InputError message={form.errors.items} />
                            {form.data.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid min-w-0 gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,15rem)_minmax(0,11rem)_minmax(0,1fr)_7rem_8rem_2.5rem]"
                                >
                                    <div className="grid min-w-0 gap-2">
                                        <Label>Service</Label>
                                        <Select
                                            value={item.service_id || 'manual'}
                                            onValueChange={(value) =>
                                                selectService(index, value)
                                            }
                                        >
                                            <SelectTrigger className="w-full min-w-0 [&>span]:truncate">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="max-w-[calc(100vw-2rem)]"
                                            >
                                                <SelectItem value="manual">
                                                    Manual item
                                                </SelectItem>
                                                {services.map((service) => (
                                                    <SelectItem
                                                        key={service.id}
                                                        value={service.id.toString()}
                                                        disabled={
                                                            service.status !==
                                                            'active'
                                                        }
                                                    >
                                                        {service.name} -{' '}
                                                        {money(service.price)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                errors[
                                                    `items.${index}.service_id`
                                                ]
                                            }
                                        />
                                    </div>
                                    <div className="grid min-w-0 gap-2">
                                        <Label>Type</Label>
                                        <Select
                                            value={item.item_type}
                                            onValueChange={(value) =>
                                                updateItem(
                                                    index,
                                                    'item_type',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full min-w-0 [&>span]:truncate">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {item_types.map((type) => (
                                                    <SelectItem
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                errors[
                                                    `items.${index}.item_type`
                                                ]
                                            }
                                        />
                                    </div>
                                    <TextField
                                        label="Description"
                                        value={item.description}
                                        error={
                                            errors[`items.${index}.description`]
                                        }
                                        onChange={(value) =>
                                            updateItem(
                                                index,
                                                'description',
                                                value,
                                            )
                                        }
                                    />
                                    <TextField
                                        label="Qty"
                                        type="number"
                                        value={item.quantity}
                                        error={
                                            errors[`items.${index}.quantity`]
                                        }
                                        onChange={(value) =>
                                            updateItem(index, 'quantity', value)
                                        }
                                    />
                                    <TextField
                                        label="Unit price"
                                        type="number"
                                        value={item.unit_price}
                                        error={
                                            errors[`items.${index}.unit_price`]
                                        }
                                        onChange={(value) =>
                                            updateItem(
                                                index,
                                                'unit_price',
                                                value,
                                            )
                                        }
                                    />
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={
                                                form.data.items.length === 1
                                            }
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
                                                Remove item
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Totals</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-4">
                            <Summary label="Subtotal" value={money(subtotal)} />
                            <TextField
                                label="Discount"
                                type="number"
                                value={form.data.discount}
                                error={form.errors.discount}
                                onChange={(value) =>
                                    form.setData('discount', value)
                                }
                            />
                            <TextField
                                label="Tax"
                                type="number"
                                value={form.data.tax}
                                error={form.errors.tax}
                                onChange={(value) => form.setData('tax', value)}
                            />
                            <Summary
                                label="Grand total"
                                value={money(grandTotal)}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save bill'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function TextField({
    label,
    value,
    error,
    type = 'text',
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    type?: string;
    onChange: (value: string) => void;
}) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div className="grid min-w-0 gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                step={type === 'number' ? '0.01' : undefined}
                value={value}
                className="min-w-0"
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-2 rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    );
}

function SourceDetail({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="truncate text-sm font-medium">{value}</p>
        </div>
    );
}
