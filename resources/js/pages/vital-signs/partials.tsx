import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { FileClock } from 'lucide-react';
import { VitalSign } from './types';

type Measurement = {
    label: string;
    value: string;
    isAbnormal: boolean;
};

export function VitalSignSummary({
    vitalSign,
    emptyActionHref,
}: {
    vitalSign: VitalSign | null;
    emptyActionHref?: string;
}) {
    if (!vitalSign) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No vital signs recorded.
                {emptyActionHref && (
                    <div className="mt-3">
                        <Button size="sm" asChild>
                            <Link href={emptyActionHref}>
                                <FileClock />
                                Record vital signs
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    const measurements = vitalMeasurements(vitalSign);

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    Recorded {formatDateTime(vitalSign.recorded_at)}
                    {vitalSign.recorder?.name
                        ? ` by ${vitalSign.recorder.name}`
                        : ''}
                </div>
                {measurements.some((item) => item.isAbnormal) && (
                    <Badge variant="destructive">Review values</Badge>
                )}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {measurements.map((item) => (
                    <div
                        key={item.label}
                        className={
                            item.isAbnormal
                                ? 'rounded-md border border-destructive/40 bg-destructive/5 p-3'
                                : 'rounded-md border p-3'
                        }
                    >
                        <div className="text-xs font-medium text-muted-foreground">
                            {item.label}
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
            {vitalSign.notes && (
                <div className="rounded-md border p-3 text-sm">
                    {vitalSign.notes}
                </div>
            )}
        </div>
    );
}

export function VitalSignList({ vitalSigns }: { vitalSigns: VitalSign[] }) {
    return (
        <div className="grid gap-4">
            {vitalSigns.map((vitalSign) => (
                <section
                    key={vitalSign.id}
                    className="grid gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="font-semibold">
                                {vitalSign.appointment?.appointment_number ??
                                    'Vital signs'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {formatDateTime(vitalSign.recorded_at)}
                            </p>
                        </div>
                        {vitalMeasurements(vitalSign).some(
                            (item) => item.isAbnormal,
                        ) && <Badge variant="destructive">Abnormal</Badge>}
                    </div>
                    <VitalSignSummary vitalSign={vitalSign} />
                </section>
            ))}
            {vitalSigns.length === 0 && (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    No vital signs history found.
                </div>
            )}
        </div>
    );
}

export function vitalMeasurements(vitalSign: VitalSign): Measurement[] {
    return [
        {
            label: 'Temperature',
            value: formatValue(vitalSign.temperature, ' deg C'),
            isAbnormal: isTemperatureAbnormal(vitalSign.temperature),
        },
        {
            label: 'Blood pressure',
            value: vitalSign.blood_pressure ?? 'Not recorded',
            isAbnormal: isBloodPressureAbnormal(vitalSign.blood_pressure),
        },
        {
            label: 'Pulse rate',
            value: formatValue(vitalSign.pulse_rate, ' bpm'),
            isAbnormal: isOutside(vitalSign.pulse_rate, 60, 100),
        },
        {
            label: 'Respiratory rate',
            value: formatValue(vitalSign.respiratory_rate, ' rpm'),
            isAbnormal: isOutside(vitalSign.respiratory_rate, 12, 20),
        },
        {
            label: 'Oxygen saturation',
            value: formatValue(vitalSign.oxygen_saturation, '%'),
            isAbnormal:
                vitalSign.oxygen_saturation !== null &&
                Number(vitalSign.oxygen_saturation) < 95,
        },
        {
            label: 'Height',
            value: formatValue(vitalSign.height, ' cm'),
            isAbnormal: false,
        },
        {
            label: 'Weight',
            value: formatValue(vitalSign.weight, ' kg'),
            isAbnormal: false,
        },
        {
            label: 'BMI',
            value: vitalSign.bmi ?? 'Not available',
            isAbnormal: isBmiAbnormal(vitalSign.bmi),
        },
    ];
}

export function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return 'Not recorded';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatValue(value: string | number | null, suffix: string) {
    if (value === null) {
        return 'Not recorded';
    }

    return `${value}${suffix}`;
}

function isTemperatureAbnormal(value: string | null) {
    if (value === null) {
        return false;
    }

    return Number(value) < 36 || Number(value) >= 37.8;
}

function isOutside(value: number | null, min: number, max: number) {
    if (value === null) {
        return false;
    }

    return Number(value) < min || Number(value) > max;
}

function isBmiAbnormal(value: string | null) {
    if (value === null) {
        return false;
    }

    return Number(value) < 18.5 || Number(value) >= 25;
}

function isBloodPressureAbnormal(value: string | null) {
    if (!value) {
        return false;
    }

    const [systolic, diastolic] = value
        .split('/')
        .map((part) => Number(part.trim()));

    if (!systolic || !diastolic) {
        return false;
    }

    return systolic >= 140 || diastolic >= 90 || systolic < 90 || diastolic < 60;
}
