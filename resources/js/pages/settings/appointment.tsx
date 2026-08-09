import {
    appointment,
    updateAppointment,
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

type AppointmentSettingsForm = {
    appointment_slot_duration: string;
    opening_time: string;
    closing_time: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Appointment settings', href: appointment().url },
];

export default function AppointmentSettingsPage({
    settings,
}: {
    settings: ClinicSettings;
}) {
    const form = useForm<AppointmentSettingsForm>({
        appointment_slot_duration:
            settings.appointment_slot_duration.toString(),
        opening_time: settings.opening_time?.slice(0, 5) ?? '08:00',
        closing_time: settings.closing_time?.slice(0, 5) ?? '17:00',
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        form.patch(updateAppointment().url, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointment settings" />
            <SettingsLayout>
                <form onSubmit={submit} className="space-y-6">
                    <HeadingSmall
                        title="Appointment settings"
                        description="Configure appointment slot duration and operating hours."
                    />

                    <Card>
                        <CardContent className="grid gap-5 pt-6">
                            <div className="grid gap-2">
                                <Label htmlFor="appointment_slot_duration">
                                    Slot duration (minutes)
                                </Label>
                                <Input
                                    id="appointment_slot_duration"
                                    type="number"
                                    min="5"
                                    max="240"
                                    step="5"
                                    value={form.data.appointment_slot_duration}
                                    onChange={(event) =>
                                        form.setData(
                                            'appointment_slot_duration',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        form.errors.appointment_slot_duration
                                    }
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <TimeField
                                    id="opening_time"
                                    label="Opening time"
                                    value={form.data.opening_time}
                                    error={form.errors.opening_time}
                                    onChange={(value) =>
                                        form.setData('opening_time', value)
                                    }
                                />
                                <TimeField
                                    id="closing_time"
                                    label="Closing time"
                                    value={form.data.closing_time}
                                    error={form.errors.closing_time}
                                    onChange={(value) =>
                                        form.setData('closing_time', value)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            {form.processing ? 'Saving...' : 'Save appointment'}
                        </Button>
                    </div>
                </form>
            </SettingsLayout>
        </AppLayout>
    );
}

function TimeField({
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
                type="time"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}
