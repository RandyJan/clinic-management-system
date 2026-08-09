import {
    clinic,
    updateClinic,
} from '@/actions/App/Http/Controllers/Settings/ClinicSettingsController';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type ClinicSettings } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Save, Upload } from 'lucide-react';
import { type FormEvent } from 'react';

type ClinicProfileForm = {
    clinic_name: string;
    clinic_address: string;
    contact_number: string;
    email: string;
    logo: File | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clinic settings', href: clinic().url },
];

export default function ClinicSettingsPage({
    settings,
}: {
    settings: ClinicSettings;
}) {
    const form = useForm<ClinicProfileForm>({
        clinic_name: settings.clinic_name,
        clinic_address: settings.clinic_address ?? '',
        contact_number: settings.contact_number ?? '',
        email: settings.email ?? '',
        logo: null,
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        form.post(updateClinic.form.patch().action, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clinic settings" />
            <SettingsLayout>
                <form onSubmit={submit} className="space-y-6">
                    <HeadingSmall
                        title="Clinic profile"
                        description="Update clinic details used across documents and reports."
                    />

                    <Card>
                        <CardContent className="grid gap-5 pt-6">
                            <TextField
                                id="clinic_name"
                                label="Clinic name"
                                value={form.data.clinic_name}
                                error={form.errors.clinic_name}
                                onChange={(value) =>
                                    form.setData('clinic_name', value)
                                }
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="clinic_address">
                                    Clinic address
                                </Label>
                                <Textarea
                                    id="clinic_address"
                                    value={form.data.clinic_address}
                                    onChange={(event) =>
                                        form.setData(
                                            'clinic_address',
                                            event.target.value,
                                        )
                                    }
                                    rows={4}
                                />
                                <InputError
                                    message={form.errors.clinic_address}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    id="contact_number"
                                    label="Contact number"
                                    value={form.data.contact_number}
                                    error={form.errors.contact_number}
                                    onChange={(value) =>
                                        form.setData('contact_number', value)
                                    }
                                />
                                <TextField
                                    id="email"
                                    label="Email"
                                    type="email"
                                    value={form.data.email}
                                    error={form.errors.email}
                                    onChange={(value) =>
                                        form.setData('email', value)
                                    }
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="logo">Clinic logo</Label>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className="grid size-20 place-items-center overflow-hidden rounded-2xl border bg-background/70">
                                        {settings.logo_url ? (
                                            <img
                                                src={settings.logo_url}
                                                alt={settings.clinic_name}
                                                className="size-full object-contain p-2"
                                            />
                                        ) : (
                                            <Upload className="size-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <Input
                                        id="logo"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(event) =>
                                            form.setData(
                                                'logo',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </div>
                                <InputError message={form.errors.logo} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save clinic'}
                        </Button>
                    </div>
                </form>
            </SettingsLayout>
        </AppLayout>
    );
}

function TextField({
    id,
    label,
    value,
    error,
    type = 'text',
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    type?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}
