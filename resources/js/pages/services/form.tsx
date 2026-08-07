import ServiceController from '@/actions/App/Http/Controllers/ServiceController';
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
import { index as servicesIndex } from '@/routes/services';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';
import {
    type ServiceCategory,
    type ServiceDetail,
    type ServiceStatus,
} from './types';
import { formatCurrency, formatDate } from './index';

type ServiceFormData = {
    name: string;
    description: string;
    category: string;
    price: string;
    status: ServiceStatus;
};

const emptyForm: ServiceFormData = {
    name: '',
    description: '',
    category: 'Consultation',
    price: '',
    status: 'active',
};

export default function ServiceForm({
    service,
    categories,
}: {
    service?: ServiceDetail;
    categories: ServiceCategory[];
    statuses: ServiceStatus[];
}) {
    const isEditing = service !== undefined;
    const form = useForm<ServiceFormData>(
        service
            ? {
                  name: service.name,
                  description: service.description ?? '',
                  category: service.category,
                  price: service.price.toString(),
                  status: service.status,
              }
            : emptyForm,
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Services', href: servicesIndex().url },
        {
            title: isEditing ? 'Edit Service' : 'Create Service',
            href: isEditing
                ? ServiceController.edit(service.id).url
                : ServiceController.create().url,
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (service) {
            form.put(ServiceController.update(service.id).url, {
                preserveScroll: true,
            });
            return;
        }

        form.post(ServiceController.store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Service' : 'Create Service'} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditing ? 'Edit Service' : 'Create Service'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {service?.service_code ??
                                'Add a clinic charge cashiers can select'}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={servicesIndex().url}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                </div>

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <Section title="Service details">
                        <TextField
                            label="Name"
                            value={form.data.name}
                            error={form.errors.name}
                            required
                            onChange={(value) => form.setData('name', value)}
                        />
                        <SelectField
                            label="Category"
                            value={form.data.category}
                            options={categories.map((category) => [
                                category,
                                category,
                            ])}
                            error={form.errors.category}
                            required
                            onChange={(value) =>
                                form.setData('category', value)
                            }
                        />
                        <TextField
                            label="Price"
                            type="number"
                            value={form.data.price}
                            error={form.errors.price}
                            required
                            onChange={(value) => form.setData('price', value)}
                        />
                        <SelectField
                            label="Status"
                            value={form.data.status}
                            options={[
                                ['active', 'Active'],
                                ['inactive', 'Inactive'],
                            ]}
                            error={form.errors.status}
                            onChange={(value) =>
                                form.setData('status', value as ServiceStatus)
                            }
                        />
                    </Section>

                    <Section title="Description">
                        <div className="grid gap-2 lg:col-span-4">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.description} />
                        </div>
                    </Section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save service'}
                        </Button>
                    </div>
                </form>

                {service && <PriceHistory service={service} />}
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
    type = 'text',
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    required?: boolean;
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
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function SelectField({
    label,
    value,
    error,
    options,
    required,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    options: [string, string][];
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
                    {options.map(([optionValue, text]) => (
                        <SelectItem key={optionValue} value={optionValue}>
                            {text}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}

function PriceHistory({ service }: { service: ServiceDetail }) {
    return (
        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Previous price</TableHead>
                        <TableHead>New price</TableHead>
                        <TableHead>Changed by</TableHead>
                        <TableHead>Changed at</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {service.price_histories.map((history) => (
                        <TableRow key={history.id}>
                            <TableCell>
                                {formatCurrency(history.old_price)}
                            </TableCell>
                            <TableCell>
                                {formatCurrency(history.new_price)}
                            </TableCell>
                            <TableCell>
                                {history.changed_by ?? 'System'}
                            </TableCell>
                            <TableCell>
                                {formatDate(history.created_at)}
                            </TableCell>
                        </TableRow>
                    ))}
                    {service.price_histories.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="h-20 text-center text-muted-foreground"
                            >
                                No price changes recorded.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
