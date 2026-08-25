import PlatformClinicController from '@/actions/App/Http/Controllers/Platform/ClinicController';
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
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type FormEvent } from 'react';
import { type Clinic, type ClinicStatus } from './types';

type ClinicFormData = {
    name: string;
    slug: string;
    email: string;
    contact_number: string;
    address: string;
    status: ClinicStatus;
};

export default function ClinicForm({
    managedClinic,
}: {
    managedClinic?: Clinic | null;
}) {
    const isEditing = managedClinic != null;
    const form = useForm<ClinicFormData>({
        name: managedClinic?.name ?? '',
        slug: managedClinic?.slug ?? '',
        email: managedClinic?.email ?? '',
        contact_number: managedClinic?.contact_number ?? '',
        address: managedClinic?.address ?? '',
        status: managedClinic?.status ?? 'active',
    });
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clinics', href: PlatformClinicController.index().url },
        {
            title: isEditing ? 'Edit Clinic' : 'Create Clinic',
            href: isEditing
                ? PlatformClinicController.edit(managedClinic.id).url
                : PlatformClinicController.create().url,
        },
    ];

    function updateName(name: string) {
        form.setData((data) => ({
            ...data,
            name,
            slug:
                isEditing || data.slug !== slugify(data.name)
                    ? data.slug
                    : slugify(name),
        }));
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (managedClinic) {
            form.put(PlatformClinicController.update(managedClinic.id).url, {
                preserveScroll: true,
            });
            return;
        }
        form.post(PlatformClinicController.store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Clinic' : 'Create Clinic'} />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditing ? 'Edit Clinic' : 'Create Clinic'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing
                                ? managedClinic.slug
                                : 'Register a new tenant clinic on the platform'}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={PlatformClinicController.index()}>
                            <ArrowLeft />
                            Back
                        </Link>
                    </Button>
                </div>
                <form
                    onSubmit={submit}
                    className="grid max-w-4xl gap-6 rounded-lg border border-sidebar-border/70 p-4 sm:p-6"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="name"
                            label="Clinic name"
                            value={form.data.name}
                            error={form.errors.name}
                            required
                            onChange={updateName}
                        />
                        <Field
                            id="slug"
                            label="Clinic slug"
                            value={form.data.slug}
                            error={form.errors.slug}
                            required
                            onChange={(value) =>
                                form.setData('slug', slugify(value))
                            }
                        />
                        <Field
                            id="email"
                            label="Email"
                            type="email"
                            value={form.data.email}
                            error={form.errors.email}
                            onChange={(value) => form.setData('email', value)}
                        />
                        <Field
                            id="contact_number"
                            label="Contact number"
                            value={form.data.contact_number}
                            error={form.errors.contact_number}
                            onChange={(value) =>
                                form.setData('contact_number', value)
                            }
                        />
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(value) =>
                                    form.setData(
                                        'status',
                                        value as ClinicStatus,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.status} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                            />
                            <InputError message={form.errors.address} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save clinic'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({
    id,
    label,
    value,
    error,
    required,
    type = 'text',
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    required?: boolean;
    type?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
                id={id}
                type={type}
                value={value}
                required={required}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
