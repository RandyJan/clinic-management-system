import InputError from '@/components/input-error';
import PrivacyNoticeDialog from '@/components/privacy-notice/privacy-notice-dialog';
import { Turnstile } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { Form, Head } from '@inertiajs/react';
import { Info, LockKeyhole, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoginProps {
    readonly status?: string;
    readonly canResetPassword: boolean;
    readonly canRegister: boolean;
    readonly turnstileSiteKey: string;
}

export default function Login({ status, turnstileSiteKey }: LoginProps) {
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [privacyDialogOpen, setPrivacyDialogOpen] = useState(true);

    useEffect(() => {
        setPrivacyDialogOpen(true);
    }, []);

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your Active Directory username and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100">
                            <Info className="mt-0.5 size-4 shrink-0" />
                            <div className="grid gap-1">
                                <p className="font-semibold">
                                    Active Directory Account Required
                                </p>
                                <p className="leading-5 text-sky-800 dark:text-sky-200">
                                    Use your Active Directory credentials. For
                                    access assistance, contact your system
                                    administrator.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="samaccountname">Username</Label>
                                <div className="relative">
                                    <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="samaccountname"
                                        type="text"
                                        name="samaccountname"
                                        required
                                        autoFocus
                                        autoComplete="username"
                                        placeholder="username"
                                        className="h-11 pl-10"
                                    />
                                </div>
                                <InputError message={errors.samaccountname} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="h-11 pl-10"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-3">
                                <Turnstile
                                    siteKey={turnstileSiteKey}
                                    onVerify={setTurnstileToken}
                                />
                                <input
                                    type="hidden"
                                    name="cf-turnstile-response"
                                    value={turnstileToken}
                                />
                                <InputError
                                    message={errors['cf-turnstile-response']}
                                />
                            </div>

                            <div className="grid gap-3 rounded-lg border p-3">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        className="mt-1"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="font-normal"
                                    >
                                        Remember me
                                    </Label>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="privacy-accepted"
                                        checked={privacyAccepted}
                                        onCheckedChange={(checked) =>
                                            setPrivacyAccepted(checked === true)
                                        }
                                        className="mt-1"
                                        required
                                    />
                                    <div className="flex flex-col gap-1">
                                        <Label
                                            htmlFor="privacy-accepted"
                                            className="font-normal"
                                        >
                                            I acknowledge and accept the{' '}
                                            <PrivacyNoticeDialog
                                                trigger="Privacy Notice"
                                                triggerClassName="font-medium text-sky-700 underline underline-offset-4 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                                                open={privacyDialogOpen}
                                                onOpenChange={
                                                    setPrivacyDialogOpen
                                                }
                                                onAccept={() =>
                                                    setPrivacyAccepted(true)
                                                }
                                            />
                                        </Label>
                                        <InputError
                                            message={errors['privacy-accepted']}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full"
                                disabled={
                                    processing ||
                                    !turnstileToken ||
                                    !privacyAccepted
                                }
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
