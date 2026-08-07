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
import AppLayout from '@/layouts/app-layout';
import { index as medicinesIndex } from '@/routes/medicines';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';
import { type Medicine, type MedicineStatus } from './types';

type MedicineFormData = {
    name: string;
    generic_name: string;
    brand_name: string;
    category: string;
    dosage_form: string;
    strength: string;
    unit: string;
    current_stock: string;
    reorder_level: string;
    expiry_date: string;
    selling_price: string;
    cost_price: string;
    status: MedicineStatus;
};

const emptyForm: MedicineFormData = {
    name: '',
    generic_name: '',
    brand_name: '',
    category: 'Other',
    dosage_form: 'Tablet',
    strength: '',
    unit: 'tablet',
    current_stock: '0',
    reorder_level: '0',
    expiry_date: '',
    selling_price: '',
    cost_price: '0',
    status: 'active',
};

export default function MedicineForm({
    medicine,
    categories,
    dosage_forms,
}: {
    medicine?: Medicine;
    categories: string[];
    dosage_forms: string[];
    statuses: MedicineStatus[];
}) {
    const isEditing = medicine !== undefined;
    const form = useForm<MedicineFormData>(
        medicine
            ? {
                  name: medicine.name,
                  generic_name: medicine.generic_name ?? '',
                  brand_name: medicine.brand_name ?? '',
                  category: medicine.category ?? 'Other',
                  dosage_form: medicine.dosage_form ?? 'Tablet',
                  strength: medicine.strength ?? '',
                  unit: medicine.unit,
                  current_stock: medicine.current_stock.toString(),
                  reorder_level: medicine.reorder_level.toString(),
                  expiry_date: medicine.expiry_date ?? '',
                  selling_price: medicine.selling_price.toString(),
                  cost_price: medicine.cost_price.toString(),
                  status: medicine.status,
              }
            : emptyForm,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medicines', href: medicinesIndex().url },
        {
            title: isEditing ? 'Edit Medicine' : 'Add Medicine',
            href: isEditing
                ? MedicineController.edit(medicine.id).url
                : MedicineController.create().url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (medicine) {
            form.put(MedicineController.update(medicine.id).url, {
                preserveScroll: true,
            });
            return;
        }

        form.post(MedicineController.store().url, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Medicine' : 'Add Medicine'} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditing ? 'Edit Medicine' : 'Add Medicine'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {medicine?.medicine_code ??
                                'Create an inventory medicine record'}
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
                    <Section title="Medicine details">
                        <TextField
                            label="Name"
                            value={form.data.name}
                            error={form.errors.name}
                            required
                            onChange={(value) => form.setData('name', value)}
                        />
                        <TextField
                            label="Generic name"
                            value={form.data.generic_name}
                            error={form.errors.generic_name}
                            onChange={(value) =>
                                form.setData('generic_name', value)
                            }
                        />
                        <TextField
                            label="Brand name"
                            value={form.data.brand_name}
                            error={form.errors.brand_name}
                            onChange={(value) =>
                                form.setData('brand_name', value)
                            }
                        />
                        <SelectField
                            label="Category"
                            value={form.data.category}
                            options={categories}
                            error={form.errors.category}
                            required
                            onChange={(value) =>
                                form.setData('category', value)
                            }
                        />
                        <SelectField
                            label="Dosage form"
                            value={form.data.dosage_form}
                            options={dosage_forms}
                            error={form.errors.dosage_form}
                            onChange={(value) =>
                                form.setData('dosage_form', value)
                            }
                        />
                        <TextField
                            label="Strength"
                            value={form.data.strength}
                            error={form.errors.strength}
                            onChange={(value) =>
                                form.setData('strength', value)
                            }
                        />
                        <TextField
                            label="Unit"
                            value={form.data.unit}
                            error={form.errors.unit}
                            required
                            onChange={(value) => form.setData('unit', value)}
                        />
                        <SelectField
                            label="Status"
                            value={form.data.status}
                            options={['active', 'inactive']}
                            error={form.errors.status}
                            onChange={(value) =>
                                form.setData('status', value as MedicineStatus)
                            }
                        />
                    </Section>

                    <Section title="Inventory and pricing">
                        <TextField
                            label="Current stock"
                            type="number"
                            value={form.data.current_stock}
                            error={form.errors.current_stock}
                            required={!isEditing}
                            disabled={isEditing}
                            onChange={(value) =>
                                form.setData('current_stock', value)
                            }
                        />
                        <TextField
                            label="Reorder level"
                            type="number"
                            value={form.data.reorder_level}
                            error={form.errors.reorder_level}
                            required
                            onChange={(value) =>
                                form.setData('reorder_level', value)
                            }
                        />
                        <TextField
                            label="Expiry date"
                            type="date"
                            value={form.data.expiry_date}
                            error={form.errors.expiry_date}
                            onChange={(value) =>
                                form.setData('expiry_date', value)
                            }
                        />
                        <TextField
                            label="Selling price"
                            type="number"
                            value={form.data.selling_price}
                            error={form.errors.selling_price}
                            required
                            onChange={(value) =>
                                form.setData('selling_price', value)
                            }
                        />
                        <TextField
                            label="Cost price"
                            type="number"
                            value={form.data.cost_price}
                            error={form.errors.cost_price}
                            onChange={(value) =>
                                form.setData('cost_price', value)
                            }
                        />
                    </Section>

                    {isEditing && (
                        <div className="rounded-md border p-3 text-sm text-muted-foreground">
                            Use stock adjustment to change inventory quantity so
                            the movement is recorded.
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save medicine'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="grid gap-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {children}
            </div>
        </section>
    );
}

function TextField({
    label,
    value,
    error,
    required,
    disabled,
    type = 'text',
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    type?: string;
    onChange: (value: string) => void;
}) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
                id={id}
                type={type}
                min={type === 'number' ? '0' : undefined}
                step={type === 'number' ? '0.01' : undefined}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function SelectField({
    label,
    value,
    options,
    error,
    required,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    error?: string;
    required?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}
