import {
    printTemplates,
    updatePrintTemplates,
} from '@/actions/App/Http/Controllers/Settings/ClinicSettingsController';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type ClinicSettings } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { type FormEvent } from 'react';

type PrintTemplateSettingsForm = {
    receipt_footer: string;
    certificate_footer: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Print template settings', href: printTemplates().url },
];

export default function PrintTemplateSettingsPage({
    settings,
}: {
    settings: ClinicSettings;
}) {
    const form = useForm<PrintTemplateSettingsForm>({
        receipt_footer: settings.receipt_footer ?? '',
        certificate_footer: settings.certificate_footer ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        form.patch(updatePrintTemplates().url, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Print template settings" />
            <SettingsLayout>
                <form onSubmit={submit} className="space-y-6">
                    <HeadingSmall
                        title="Print templates"
                        description="Configure footer text used in printable receipts and certificates."
                    />

                    <Card>
                        <CardContent className="grid gap-5 pt-6">
                            <TemplateField
                                id="receipt_footer"
                                label="Receipt footer"
                                value={form.data.receipt_footer}
                                error={form.errors.receipt_footer}
                                onChange={(value) =>
                                    form.setData('receipt_footer', value)
                                }
                            />
                            <TemplateField
                                id="certificate_footer"
                                label="Certificate footer"
                                value={form.data.certificate_footer}
                                error={form.errors.certificate_footer}
                                onChange={(value) =>
                                    form.setData('certificate_footer', value)
                                }
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing
                                ? 'Saving...'
                                : 'Save print templates'}
                        </Button>
                    </div>
                </form>
            </SettingsLayout>
        </AppLayout>
    );
}

function TemplateField({
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
            <Textarea
                id={id}
                value={value}
                rows={5}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}
