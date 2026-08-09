import {
    billing,
    updateBilling,
} from '@/actions/App/Http/Controllers/Settings/ClinicSettingsController';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type ClinicSettings } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { type FormEvent } from 'react';

type BillingSettingsForm = {
    consultation_default_fee: string;
    tax_rate: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing settings', href: billing().url },
];

export default function BillingSettingsPage({
    settings,
}: {
    settings: ClinicSettings;
}) {
    const form = useForm<BillingSettingsForm>({
        consultation_default_fee: settings.consultation_default_fee.toString(),
        tax_rate: settings.tax_rate.toString(),
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        form.patch(updateBilling().url, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing settings" />
            <SettingsLayout>
                <form onSubmit={submit} className="space-y-6">
                    <HeadingSmall
                        title="Billing settings"
                        description="Configure default consultation fee and tax rate."
                    />

                    <Card>
                        <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                            <NumberField
                                id="consultation_default_fee"
                                label="Default consultation fee"
                                value={form.data.consultation_default_fee}
                                error={form.errors.consultation_default_fee}
                                onChange={(value) =>
                                    form.setData(
                                        'consultation_default_fee',
                                        value,
                                    )
                                }
                            />
                            <NumberField
                                id="tax_rate"
                                label="Tax rate (%)"
                                value={form.data.tax_rate}
                                error={form.errors.tax_rate}
                                onChange={(value) =>
                                    form.setData('tax_rate', value)
                                }
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save billing'}
                        </Button>
                    </div>
                </form>
            </SettingsLayout>
        </AppLayout>
    );
}

function NumberField({
    id,
    label,
    value,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}
