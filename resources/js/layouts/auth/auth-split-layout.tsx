import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CalendarCheck2, HeartPulse, ShieldCheck } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
            <div className="relative hidden min-h-dvh flex-col overflow-hidden bg-[#102326] p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#102326_0%,#17444b_48%,#315f54_100%)]" />
                <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px] opacity-25" />
                <AppLogoIcon className="absolute right-[-4rem] bottom-[-4rem] size-80 opacity-10" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-3 text-lg font-semibold"
                >
                    <span className="flex size-11 items-center justify-center rounded-md bg-white/95 p-1.5 shadow-lg shadow-black/20">
                        <AppLogoIcon className="size-full" />
                    </span>
                    {name}
                </Link>

                <div className="relative z-20 my-auto max-w-xl space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/85 backdrop-blur">
                            <ShieldCheck className="size-4" />
                            Secure clinic workspace
                        </div>
                        <h2 className="text-4xl leading-tight font-semibold text-balance">
                            A calmer way to manage every clinic visit.
                        </h2>
                        <p className="max-w-lg text-base leading-7 text-white/75">
                            Sign in to continue with appointments, queues,
                            consultations, patient records, and daily clinic
                            operations.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <HeartPulse className="mb-3 size-5 text-emerald-200" />
                            <div className="text-sm font-medium">
                                Patient-centered records
                            </div>
                            <div className="mt-1 text-sm text-white/70">
                                Vitals, history, and consultations in one place.
                            </div>
                        </div>
                        <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <CalendarCheck2 className="mb-3 size-5 text-sky-200" />
                            <div className="text-sm font-medium">
                                Live clinic flow
                            </div>
                            <div className="mt-1 text-sm text-white/70">
                                Queue and appointment status stays connected.
                            </div>
                        </div>
                    </div>
                </div>

                {quote && (
                    <div className="relative z-20 mt-auto max-w-xl">
                        <blockquote className="space-y-2">
                            <p className="text-base text-white/85">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-sm text-white/60">
                                {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="flex min-h-dvh w-full items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <span className="flex size-16 items-center justify-center rounded-lg border bg-card p-2 shadow-sm">
                            <AppLogoIcon className="size-full" />
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm leading-6 text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card/95 p-5 shadow-xl shadow-black/5 sm:p-6 dark:bg-card/80">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
