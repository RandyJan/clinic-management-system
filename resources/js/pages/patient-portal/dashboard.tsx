import PatientPortalController from '@/actions/App/Http/Controllers/PatientPortalController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    ClipboardList,
    CreditCard,
    Pill,
    Plus,
} from 'lucide-react';
import { AppointmentTable } from '../appointments/partials';
import {
    EmptyState,
    formatDate,
    money,
    PortalHeader,
    StatCard,
    StatusBadge,
} from './partials';
import { PortalDashboardProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patient Portal', href: PatientPortalController.dashboard().url },
];

export default function PatientPortalDashboard({
    patient,
    stats,
    appointments,
    consultations,
    bills,
}: PortalDashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patient Portal" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <PortalHeader
                    title={`Welcome, ${patient.first_name}`}
                    description="View your appointments, records, prescriptions, lab results, and billing history."
                    action={
                        <Button asChild>
                            <Link
                                href={
                                    PatientPortalController.createAppointment()
                                        .url
                                }
                            >
                                <Plus />
                                Request appointment
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Upcoming appointments"
                        value={stats.upcoming_appointments}
                        icon={CalendarClock}
                    />
                    <StatCard
                        label="Completed consultations"
                        value={stats.completed_consultations}
                        icon={ClipboardList}
                    />
                    <StatCard
                        label="Pending prescriptions"
                        value={stats.pending_prescriptions}
                        icon={Pill}
                    />
                    <StatCard
                        label="Unpaid bills"
                        value={stats.unpaid_bills}
                        icon={CreditCard}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.55fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AppointmentTable
                                appointments={appointments}
                                actions={false}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Billing status</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {bills.length === 0 ? (
                                <EmptyState description="No billing records are available yet." />
                            ) : (
                                bills.map((bill) => (
                                    <div
                                        key={bill.id}
                                        className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-medium">
                                                    {bill.invoice_number}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDate(
                                                        bill.created_at,
                                                    )}
                                                </div>
                                            </div>
                                            <StatusBadge
                                                status={bill.payment_status}
                                            />
                                        </div>
                                        <div className="mt-2 text-sm">
                                            Balance:{' '}
                                            <span className="font-semibold">
                                                {money(bill.balance_due)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent consultations</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {consultations.length === 0 ? (
                            <EmptyState description="No consultation records are available yet." />
                        ) : (
                            consultations.map((consultation) => (
                                <div
                                    key={consultation.id}
                                    className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="font-semibold">
                                                {
                                                    consultation.consultation_number
                                                }
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {consultation.doctor.full_name}{' '}
                                                -{' '}
                                                {
                                                    consultation.doctor
                                                        .specialization
                                                }
                                            </p>
                                        </div>
                                        <StatusBadge
                                            status={consultation.status}
                                        />
                                    </div>
                                    <p className="mt-3 text-sm">
                                        {consultation.diagnosis ??
                                            'No diagnosis recorded.'}
                                    </p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
