import VitalSignController from '@/actions/App/Http/Controllers/VitalSignController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { show as appointmentShow } from '@/routes/appointments';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEvent } from 'react';
import { VitalSign, VitalSignAppointment, VitalSignFormData } from './types';
import { VitalSignSummary } from './partials';

export default function RecordVitalSigns({
    appointment,
    latest_vital_signs,
}: {
    appointment: VitalSignAppointment;
    latest_vital_signs: VitalSign | null;
}) {
    const form = useForm<VitalSignFormData>({
        patient_id: appointment.patient_id.toString(),
        appointment_id: appointment.id.toString(),
        temperature: '',
        blood_pressure: '',
        pulse_rate: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        height: '',
        weight: '',
        notes: '',
        recorded_at: new Date().toISOString().slice(0, 16),
    });
    const bmiPreview = calculateBmi(form.data.height, form.data.weight);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Appointments',
            href: appointmentShow(appointment.id).url,
        },
        { title: 'Record Vital Signs', href: '#' },
    ];

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(VitalSignController.store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Record Vital Signs" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Record Vital Signs
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {appointment.patient.full_name} -{' '}
                            {appointment.appointment_number}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={appointmentShow(appointment.id).url}>
                            <ArrowLeft />
                            Appointment
                        </Link>
                    </Button>
                </div>

                {latest_vital_signs && (
                    <section className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="font-semibold">
                            Latest recorded values
                        </h2>
                        <VitalSignSummary vitalSign={latest_vital_signs} />
                    </section>
                )}

                <form
                    onSubmit={submit}
                    className="grid gap-4 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <NumberField
                            label="Temperature"
                            suffix="deg C"
                            value={form.data.temperature}
                            error={form.errors.temperature}
                            onChange={(value) =>
                                form.setData('temperature', value)
                            }
                        />
                        <TextField
                            label="Blood pressure"
                            placeholder="120/80"
                            value={form.data.blood_pressure}
                            error={form.errors.blood_pressure}
                            onChange={(value) =>
                                form.setData('blood_pressure', value)
                            }
                        />
                        <NumberField
                            label="Pulse rate"
                            suffix="bpm"
                            value={form.data.pulse_rate}
                            error={form.errors.pulse_rate}
                            onChange={(value) =>
                                form.setData('pulse_rate', value)
                            }
                        />
                        <NumberField
                            label="Respiratory rate"
                            suffix="rpm"
                            value={form.data.respiratory_rate}
                            error={form.errors.respiratory_rate}
                            onChange={(value) =>
                                form.setData('respiratory_rate', value)
                            }
                        />
                        <NumberField
                            label="Oxygen saturation"
                            suffix="%"
                            value={form.data.oxygen_saturation}
                            error={form.errors.oxygen_saturation}
                            onChange={(value) =>
                                form.setData('oxygen_saturation', value)
                            }
                        />
                        <NumberField
                            label="Height"
                            suffix="cm"
                            value={form.data.height}
                            error={form.errors.height}
                            onChange={(value) => form.setData('height', value)}
                        />
                        <NumberField
                            label="Weight"
                            suffix="kg"
                            value={form.data.weight}
                            error={form.errors.weight}
                            onChange={(value) => form.setData('weight', value)}
                        />
                        <div className="grid gap-2 rounded-md border p-3">
                            <div className="text-sm font-medium">BMI</div>
                            <div className="text-2xl font-semibold">
                                {bmiPreview ?? 'Not available'}
                            </div>
                        </div>
                        <TextField
                            label="Recorded at"
                            type="datetime-local"
                            value={form.data.recorded_at}
                            error={form.errors.recorded_at}
                            onChange={(value) =>
                                form.setData('recorded_at', value)
                            }
                        />
                        <div className="grid gap-2 md:col-span-2 lg:col-span-4">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={form.data.notes}
                                onChange={(event) =>
                                    form.setData('notes', event.target.value)
                                }
                            />
                            <InputError message={form.errors.notes} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save />
                            Save vital signs
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
    placeholder,
    type = 'text',
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    placeholder?: string;
    type?: string;
    onChange: (value: string) => void;
}) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <InputError message={error} />
        </div>
    );
}

function NumberField({
    label,
    suffix,
    value,
    error,
    onChange,
}: {
    label: string;
    suffix: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <TextField
            label={`${label} (${suffix})`}
            type="number"
            value={value}
            error={error}
            onChange={onChange}
        />
    );
}

function calculateBmi(height: string, weight: string) {
    if (!height || !weight || Number(height) <= 0) {
        return null;
    }

    return (Number(weight) / (Number(height) / 100) ** 2).toFixed(2);
}
