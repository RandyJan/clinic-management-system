import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    CalendarCheck2,
    Check,
    ChevronRight,
    ClipboardList,
    Clock3,
    FileHeart,
    FlaskConical,
    LockKeyhole,
    Menu,
    PackageCheck,
    Pill,
    Quote,
    ReceiptText,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    UserRoundCheck,
    UsersRound,
} from 'lucide-react';
import { useEffect, useRef, type ComponentType, type SVGProps } from 'react';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type InfoItem = [Icon, string, string];

const navItems = [
    ['Home', '#home'],
    ['Features', '#features'],
    ['Modules', '#modules'],
    ['How It Works', '#how-it-works'],
    ['Pricing', '#pricing'],
    ['About', '#about'],
] as const;
const features: InfoItem[] = [
    [
        UsersRound,
        'Patient Records',
        'Keep profiles, histories, and clinical notes in one organized workspace.',
    ],
    [
        CalendarCheck2,
        'Appointments',
        'Coordinate bookings, availability, and visit status without spreadsheet drift.',
    ],
    [
        ClipboardList,
        'Consultations',
        'Move from intake to assessment and treatment with clear clinical context.',
    ],
    [
        Pill,
        'Prescriptions',
        'Create legible prescriptions connected to the correct consultation and patient.',
    ],
    [
        FlaskConical,
        'Laboratory',
        'Track requests, results, and attachments through a consistent workflow.',
    ],
    [
        ReceiptText,
        'Billing',
        'Prepare itemized charges, record payments, and keep receipts easy to find.',
    ],
];
const modules: Array<[Icon, string, string, string]> = [
    [
        UsersRound,
        'Patients',
        'Complete longitudinal profiles',
        'bg-blue-50 text-blue-700',
    ],
    [
        CalendarCheck2,
        'Appointments',
        'Schedules and visit status',
        'bg-emerald-50 text-emerald-700',
    ],
    [
        Stethoscope,
        'Consultations',
        'Structured clinical encounters',
        'bg-cyan-50 text-cyan-700',
    ],
    [
        Pill,
        'Pharmacy',
        'Medicine and prescription flow',
        'bg-rose-50 text-rose-700',
    ],
    [
        FlaskConical,
        'Laboratory',
        'Requests and result tracking',
        'bg-violet-50 text-violet-700',
    ],
    [
        ReceiptText,
        'Billing',
        'Charges, payments, and receipts',
        'bg-amber-50 text-amber-800',
    ],
    [
        PackageCheck,
        'Inventory',
        'Stock levels and expiry alerts',
        'bg-teal-50 text-teal-700',
    ],
    [
        BarChart3,
        'Reports',
        'Operational clinic visibility',
        'bg-indigo-50 text-indigo-700',
    ],
];
const roles = [
    [
        'Administrator',
        'Configure access, clinic settings, services, and operational oversight.',
    ],
    [
        'Doctor',
        'Review histories, document consultations, and issue clinical orders.',
    ],
    [
        'Receptionist',
        'Register patients, book appointments, and coordinate the daily queue.',
    ],
    [
        'Nurse',
        'Record vitals and prepare accurate context before the consultation.',
    ],
    ['Cashier', 'Create billings, receive payments, and issue clear receipts.'],
    [
        'Patient',
        'View personal appointments and health information through the portal.',
    ],
] as const;

function SectionHeading({
    eyebrow,
    title,
    copy,
    dark = false,
}: {
    eyebrow: string;
    title: string;
    copy: string;
    dark?: boolean;
}) {
    return (
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
            <p
                className={`mb-3 text-sm font-semibold ${dark ? 'text-cyan-300' : 'text-blue-700'}`}
            >
                {eyebrow}
            </p>
            <h2
                className={`text-3xl font-semibold sm:text-4xl ${dark ? 'text-white' : 'text-slate-950'}`}
            >
                {title}
            </h2>
            <p
                className={`mt-4 leading-7 ${dark ? 'text-slate-300' : 'text-slate-600'}`}
            >
                {copy}
            </p>
        </div>
    );
}

function DashboardPreview() {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
            <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
                <div className="flex items-center gap-2">
                    <AppLogoIcon className="size-7 rounded-md" />
                    <span className="text-sm font-semibold text-slate-800">
                        Clinic overview
                    </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Live today
                </span>
            </div>
            <div className="grid min-h-[360px] grid-cols-[64px_1fr] sm:grid-cols-[170px_1fr]">
                <aside className="border-r border-slate-800 bg-slate-950 p-3 text-slate-300">
                    {['Overview', 'Patients', 'Appointments', 'Billing'].map(
                        (item, index) => (
                            <div
                                key={item}
                                className={`mb-2 flex h-9 items-center gap-2 rounded-md px-2 text-xs ${index === 0 ? 'bg-blue-600 text-white' : ''}`}
                            >
                                <span className="size-2 rounded-full bg-current" />
                                <span className="hidden sm:inline">{item}</span>
                            </div>
                        ),
                    )}
                </aside>
                <div className="min-w-0 bg-slate-50/80 p-4 sm:p-6">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[
                            ['148', 'Patients'],
                            ['24', 'Today'],
                            ['7', 'Waiting'],
                            ['₱38k', 'Collected'],
                        ].map(([value, label]) => (
                            <div
                                key={label}
                                className="rounded-md border border-slate-200 bg-white p-3"
                            >
                                <p className="text-xl font-semibold">{value}</p>
                                <p className="text-xs text-slate-500">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                        <div className="rounded-md border border-slate-200 bg-white p-4">
                            <div className="mb-5 flex justify-between">
                                <p className="text-sm font-semibold">
                                    Patient visits
                                </p>
                                <p className="text-xs text-slate-500">
                                    This week
                                </p>
                            </div>
                            <div
                                className="flex h-36 items-end gap-2"
                                aria-label="Patient visit chart"
                            >
                                {[42, 68, 50, 86, 64, 78, 55].map(
                                    (height, index) => (
                                        <div
                                            key={index}
                                            className="flex h-full flex-1 items-end rounded-t-sm bg-blue-100"
                                        >
                                            <div
                                                className="w-full rounded-t-sm bg-blue-600"
                                                style={{ height: `${height}%` }}
                                            />
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-sm font-semibold">
                                Upcoming
                            </p>
                            {[
                                'Maria Santos',
                                'Joel Ramirez',
                                'Angela Cruz',
                            ].map((name, index) => (
                                <div
                                    key={name}
                                    className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700">
                                        {name[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">
                                            {name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {9 + index}:30 AM
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Landing({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const landingPageRef = useRef<HTMLDivElement>(null);
    const { auth, clinic } = usePage<SharedData>().props;
    const clinicName =
        clinic?.clinic_name ||
        import.meta.env.VITE_APP_NAME ||
        'Clinic Management System';
    const primaryHref = auth.user
        ? dashboard()
        : canRegister
          ? register()
          : login();
    const primaryLabel = auth.user
        ? 'Open Dashboard'
        : canRegister
          ? 'Get Started'
          : 'Sign In';

    useEffect(() => {
        const landingPage = landingPageRef.current;

        if (!landingPage) {
            return;
        }

        const sections = Array.from(
            landingPage.querySelectorAll<HTMLElement>('main > section'),
        );

        landingPage.classList.add('landing-reveal-ready');

        if (!('IntersectionObserver' in window)) {
            sections.forEach((section) => section.classList.add('is-visible'));

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            },
            { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
        );

        sections.forEach((section, index) => {
            section.style.setProperty(
                '--reveal-delay',
                `${Math.min(index * 35, 180)}ms`,
            );
            observer.observe(section);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Head title="Clinic Management System">
                <meta
                    name="description"
                    content="A connected clinic workspace for patient records, appointments, consultations, laboratory requests, pharmacy, billing, and reporting."
                />
            </Head>
            <div
                ref={landingPageRef}
                className="landing-page min-h-screen overflow-x-hidden bg-[#f7fafc] text-slate-950 selection:bg-blue-200"
            >
                <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
                    <nav
                        aria-label="Main navigation"
                        className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-lg border border-white/70 bg-white/80 px-4 shadow-[0_12px_35px_rgba(15,23,42,0.1)] backdrop-blur-xl sm:px-5"
                    >
                        <a
                            href="#home"
                            className="flex min-w-0 items-center gap-3"
                            aria-label={`${clinicName} home`}
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-600 p-1.5">
                                <AppLogoIcon className="size-full" />
                            </span>
                            <span className="max-w-44 truncate text-sm font-semibold sm:max-w-64">
                                {clinicName}
                            </span>
                        </a>
                        <div className="hidden items-center gap-6 lg:flex">
                            {navItems.map(([label, href]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                        <div className="hidden items-center gap-2 sm:flex">
                            {!auth.user && (
                                <Button asChild variant="ghost">
                                    <Link href={login()}>Sign In</Link>
                                </Button>
                            )}
                            <Button asChild>
                                <Link href={primaryHref}>
                                    {primaryLabel}
                                    <ArrowRight />
                                </Link>
                            </Button>
                        </div>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="sm:hidden"
                                    aria-label="Open navigation"
                                >
                                    <Menu />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-white/95">
                                <SheetHeader>
                                    <SheetTitle>{clinicName}</SheetTitle>
                                    <SheetDescription>
                                        Clinic navigation
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="flex flex-col gap-1 px-4">
                                    {navItems.map(([label, href]) => (
                                        <SheetClose asChild key={href}>
                                            <a
                                                href={href}
                                                className="rounded-md px-3 py-3 font-medium text-slate-700 hover:bg-blue-50"
                                            >
                                                {label}
                                            </a>
                                        </SheetClose>
                                    ))}
                                </div>
                                <div className="mt-auto grid gap-2 p-4">
                                    {!auth.user && (
                                        <Button asChild variant="outline">
                                            <Link href={login()}>Sign In</Link>
                                        </Button>
                                    )}
                                    <Button asChild>
                                        <Link href={primaryHref}>
                                            {primaryLabel}
                                        </Link>
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </nav>
                </header>

                <main>
                    <section
                        id="home"
                        className="relative flex min-h-[740px] items-end overflow-hidden pt-28 pb-14 sm:min-h-[780px] sm:pb-20"
                    >
                        <img
                            src="/img/clinic-hero.png"
                            alt="A clinician assisting a patient in a modern clinic"
                            className="absolute inset-0 size-full object-cover object-[68%_center]"
                            fetchPriority="high"
                        />
                        <div className="absolute inset-0 bg-white/55" />
                        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
                            <div className="max-w-2xl">
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-blue-700 backdrop-blur-md">
                                    <Sparkles className="size-4" />
                                    One connected clinic workspace
                                </div>
                                <h1 className="max-w-xl text-5xl leading-[1.04] font-semibold sm:text-6xl lg:text-7xl">
                                    Clinic Management System
                                </h1>
                                <p className="mt-6 max-w-xl text-xl font-medium text-slate-800 sm:text-2xl">
                                    Simplify your clinic. Focus more on your
                                    patients.
                                </p>
                                <p className="mt-4 max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                                    Bring patient records, appointments,
                                    clinical workflows, inventory, laboratory
                                    requests, and billing into one clear,
                                    role-aware system.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 px-6"
                                    >
                                        <Link href={primaryHref}>
                                            {primaryLabel}
                                            <ArrowRight />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="h-12 border-white bg-white/75 px-6"
                                    >
                                        <a href="#features">
                                            Explore Features
                                            <ChevronRight />
                                        </a>
                                    </Button>
                                </div>
                                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
                                    {[
                                        'Role-based access',
                                        'Connected patient history',
                                        'Built for daily clinic work',
                                    ].map((item) => (
                                        <span
                                            key={item}
                                            className="flex items-center gap-2"
                                        >
                                            <Check className="size-4 text-emerald-600" />
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        aria-label="Product overview"
                        className="relative -mt-7 px-5 pb-20 sm:px-8"
                    >
                        <div className="mx-auto max-w-7xl">
                            <DashboardPreview />
                        </div>
                    </section>
                    <section className="border-y border-slate-200 bg-white py-8">
                        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 text-center sm:grid-cols-4 sm:px-8">
                            {[
                                ['8+', 'Connected modules'],
                                ['6', 'Role-based workspaces'],
                                ['1', 'Longitudinal patient record'],
                                ['24/7', 'Secure system access'],
                            ].map(([value, label]) => (
                                <div key={label}>
                                    <p className="text-2xl font-semibold text-blue-700">
                                        {value}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section
                        id="features"
                        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-7xl">
                            <SectionHeading
                                eyebrow="Core features"
                                title="Everyday clinic work, connected"
                                copy="Give each team member the context and tools they need while keeping the patient journey coherent from arrival to payment."
                            />
                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {features.map(([Icon, title, copy]) => (
                                    <article
                                        key={title}
                                        className="rounded-lg border border-white/80 bg-white/70 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-1"
                                    >
                                        <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-blue-600 text-white">
                                            <Icon className="size-5" />
                                        </div>
                                        <h3 className="text-lg font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-2 leading-6 text-slate-600">
                                            {copy}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="how-it-works"
                        className="scroll-mt-24 bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-7xl">
                            <SectionHeading
                                dark
                                eyebrow="How it works"
                                title="A clearer path through every visit"
                                copy="A shared workflow replaces handoffs scattered across paper, chat, and disconnected files."
                            />
                            <div className="grid gap-px overflow-hidden rounded-lg bg-white/15 md:grid-cols-3">
                                {[
                                    [
                                        UserRoundCheck,
                                        '01',
                                        'Register the patient',
                                        'Create or find a profile and preserve a reliable record.',
                                    ],
                                    [
                                        Clock3,
                                        '02',
                                        'Coordinate care',
                                        'Book the visit, manage the queue, capture vitals, and document care.',
                                    ],
                                    [
                                        BadgeCheck,
                                        '03',
                                        'Complete the encounter',
                                        'Issue orders, settle billing, and keep every detail connected.',
                                    ],
                                ].map(([Icon, number, title, copy]) => {
                                    const StepIcon = Icon as Icon;
                                    return (
                                        <article
                                            key={number as string}
                                            className="bg-slate-950 p-7 sm:p-9"
                                        >
                                            <div className="flex items-center justify-between">
                                                <StepIcon className="size-8 text-cyan-300" />
                                                <span className="text-sm font-semibold text-cyan-300">
                                                    {number as string}
                                                </span>
                                            </div>
                                            <h3 className="mt-8 text-xl font-semibold">
                                                {title as string}
                                            </h3>
                                            <p className="mt-3 leading-7 text-slate-300">
                                                {copy as string}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section
                        id="modules"
                        className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-7xl">
                            <SectionHeading
                                eyebrow="Modules"
                                title="One system, purpose-built workspaces"
                                copy="The modules share context while keeping each operational task focused and easy to scan."
                            />
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {modules.map(([Icon, title, copy, color]) => (
                                    <article
                                        key={title}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-lg"
                                    >
                                        <div
                                            className={`flex size-10 items-center justify-center rounded-md ${color}`}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <h3 className="mt-5 font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {copy}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="px-5 py-20 sm:px-8 sm:py-28">
                        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                            <div>
                                <p className="text-sm font-semibold text-blue-700">
                                    Patient experience
                                </p>
                                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                                    The right information follows the patient
                                </h2>
                                <p className="mt-4 max-w-xl leading-7 text-slate-600">
                                    Staff can understand the current visit
                                    alongside prior records, prescriptions,
                                    laboratory requests, and billing activity.
                                    Patients get a consistent experience instead
                                    of repeating the same story at every desk.
                                </p>
                                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                    {[
                                        'Unified profile and history',
                                        'Appointment visibility',
                                        'Clinical notes in context',
                                        'Portal-ready information',
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3 text-sm font-medium text-slate-700"
                                        >
                                            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                                <Check className="size-4" />
                                            </span>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-lg border border-white bg-white/70 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-7">
                                <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-cyan-100 font-semibold text-cyan-800">
                                        MS
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            Maria Santos
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Patient ID PT-2026-0148
                                        </p>
                                    </div>
                                    <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                        Active
                                    </span>
                                </div>
                                <div className="mt-5 grid grid-cols-3 gap-3">
                                    {[
                                        ['Blood type', 'O+'],
                                        ['Last visit', 'Aug 18'],
                                        ['Visits', '6'],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="rounded-md bg-slate-50 p-3"
                                        >
                                            <p className="text-xs text-slate-500">
                                                {label}
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 space-y-3">
                                    {[
                                        ['Today', 'Follow-up consultation'],
                                        [
                                            'Jul 06',
                                            'Laboratory result recorded',
                                        ],
                                        ['May 12', 'Prescription issued'],
                                    ].map(([date, event]) => (
                                        <div
                                            key={event}
                                            className="flex gap-4 rounded-md border border-slate-200 p-3"
                                        >
                                            <FileHeart className="size-5 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {event}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {date}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        id="pricing"
                        className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-7xl">
                            <SectionHeading
                                eyebrow="Illustrative pricing"
                                title="Choose the plan that fits your clinic"
                                copy="Start with the essentials and expand as your team, patient volume, and operational needs grow."
                            />
                            <div className="grid items-stretch gap-5 lg:grid-cols-3">
                                {[
                                    {
                                        name: 'Starter',
                                        price: '₱999',
                                        description:
                                            'For small practices building a reliable digital workflow.',
                                        features: [
                                            'Up to 3 staff accounts',
                                            'Patient records',
                                            'Appointments and queue',
                                            'Basic billing',
                                            'Email support',
                                        ],
                                    },
                                    {
                                        name: 'Clinic',
                                        price: '₱2,499',
                                        description:
                                            'For growing clinics coordinating care across a complete team.',
                                        features: [
                                            'Up to 15 staff accounts',
                                            'All clinical modules',
                                            'Laboratory and pharmacy',
                                            'Inventory and reports',
                                            'Priority support',
                                        ],
                                        featured: true,
                                    },
                                    {
                                        name: 'Network',
                                        price: 'Custom',
                                        description:
                                            'For organizations managing larger teams and multiple workflows.',
                                        features: [
                                            'Flexible staff access',
                                            'Advanced role controls',
                                            'Operational reporting',
                                            'Guided onboarding',
                                            'Dedicated support',
                                        ],
                                    },
                                ].map((plan) => (
                                    <article
                                        key={plan.name}
                                        className={`relative flex flex-col rounded-lg border p-6 sm:p-8 ${
                                            plan.featured
                                                ? 'border-blue-600 bg-blue-600 text-white shadow-[0_24px_70px_rgba(37,99,235,0.24)]'
                                                : 'border-slate-200 bg-slate-50 text-slate-950'
                                        }`}
                                    >
                                        {plan.featured && (
                                            <span className="absolute top-5 right-5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-50">
                                                Most popular
                                            </span>
                                        )}
                                        <p
                                            className={`text-sm font-semibold ${plan.featured ? 'text-blue-100' : 'text-blue-700'}`}
                                        >
                                            {plan.name}
                                        </p>
                                        <div className="mt-5 flex items-end gap-2">
                                            <p className="text-4xl font-semibold">
                                                {plan.price}
                                            </p>
                                            {plan.price !== 'Custom' && (
                                                <p
                                                    className={`pb-1 text-sm ${plan.featured ? 'text-blue-100' : 'text-slate-500'}`}
                                                >
                                                    / month
                                                </p>
                                            )}
                                        </div>
                                        <p
                                            className={`mt-4 min-h-14 leading-6 ${plan.featured ? 'text-blue-50' : 'text-slate-600'}`}
                                        >
                                            {plan.description}
                                        </p>
                                        <ul className="mt-7 flex-1 space-y-3">
                                            {plan.features.map((feature) => (
                                                <li
                                                    key={feature}
                                                    className="flex items-start gap-3 text-sm"
                                                >
                                                    <Check
                                                        className={`mt-0.5 size-4 shrink-0 ${plan.featured ? 'text-emerald-200' : 'text-emerald-600'}`}
                                                    />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            asChild
                                            variant={
                                                plan.featured
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            size="lg"
                                            className={`mt-8 w-full ${plan.featured ? 'bg-white text-blue-700 hover:bg-blue-50' : ''}`}
                                        >
                                            <Link href={primaryHref}>
                                                {plan.name === 'Network'
                                                    ? 'Contact Us'
                                                    : 'Start with ' + plan.name}
                                                <ArrowRight />
                                            </Link>
                                        </Button>
                                    </article>
                                ))}
                            </div>
                            <p className="mt-6 text-center text-xs text-slate-500">
                                Sample pricing for presentation purposes. Final
                                plans, inclusions, and taxes may vary.
                            </p>
                        </div>
                    </section>

                    <section
                        id="about"
                        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-7xl">
                            <SectionHeading
                                eyebrow="For the whole clinic"
                                title="Focused access for every role"
                                copy="Each workspace reflects the responsibilities of the person using it, while administrators retain clear oversight."
                            />
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {roles.map(([title, copy]) => (
                                    <article
                                        key={title}
                                        className="rounded-lg border border-slate-200 p-5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="size-5 text-blue-600" />
                                            <h3 className="font-semibold">
                                                {title}
                                            </h3>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            {copy}
                                        </p>
                                    </article>
                                ))}
                            </div>
                            <div className="mt-16 grid gap-6 rounded-lg bg-slate-950 p-7 text-white sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
                                <div>
                                    <LockKeyhole className="size-9 text-cyan-300" />
                                    <h3 className="mt-5 text-2xl font-semibold">
                                        Privacy-minded by design
                                    </h3>
                                    <p className="mt-3 leading-7 text-slate-300">
                                        Role-based permissions, authenticated
                                        workspaces, and audit visibility help
                                        clinics manage sensitive information
                                        with greater control.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {[
                                        'Permission-based modules',
                                        'Account verification',
                                        'Activity audit trail',
                                        'Controlled patient portal',
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3 rounded-md border border-white/15 bg-white/5 p-4 text-sm"
                                        >
                                            <ShieldCheck className="size-5 text-emerald-300" />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="px-5 py-20 sm:px-8 sm:py-28">
                        <div className="mx-auto max-w-5xl text-center">
                            <Quote className="mx-auto size-9 text-rose-500" />
                            <blockquote className="mt-6 text-2xl leading-relaxed font-medium sm:text-3xl">
                                “The value of a clinic system is simple: fewer
                                gaps between people, clearer information, and
                                more attention left for the patient.”
                            </blockquote>
                            <p className="mt-5 text-sm text-slate-500">
                                Representative product scenario
                            </p>
                        </div>
                    </section>
                    <section className="px-5 pb-20 sm:px-8 sm:pb-28">
                        <div className="mx-auto max-w-7xl overflow-hidden rounded-lg bg-blue-600 px-6 py-12 text-white shadow-[0_24px_70px_rgba(37,99,235,0.25)] sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-blue-100">
                                    Ready for a clearer clinic day?
                                </p>
                                <h2 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
                                    Put patient care and clinic operations in
                                    one place.
                                </h2>
                            </div>
                            <Button
                                asChild
                                size="lg"
                                className="mt-8 h-12 bg-white px-6 text-blue-700 hover:bg-blue-50 lg:mt-0"
                            >
                                <Link href={primaryHref}>
                                    {primaryLabel}
                                    <ArrowRight />
                                </Link>
                            </Button>
                        </div>
                    </section>
                </main>
                <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <AppLogoIcon className="size-8 rounded-md" />
                            <div>
                                <p className="text-sm font-semibold">
                                    {clinicName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Connected care, clearer operations.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-5 text-sm text-slate-600">
                            {navItems.slice(1).map(([label, href]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="hover:text-blue-700"
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500">
                            © {new Date().getFullYear()} {clinicName}
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
