import InputError from '@/components/input-error';
import PrivacyNoticeDialog from '@/components/privacy-notice/privacy-notice-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Mail, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';

type RegisterForm = {
    name: string;
    username: string;
    email: string;
    clinic_id: string;
    password: string;
    password_confirmation: string;
};

export default function Register({
    clinics,
}: {
    clinics: Array<{ id: number; name: string }>;
}) {
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
    const form = useForm<RegisterForm>({
        name: '',
        username: '',
        email: '',
        clinic_id: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/register', {
            preserveScroll: true,
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }

    return (
        <AuthLayout
            title="Create an account"
            description="Register for access. Your account will be reviewed by an administrator before you can log in."
        >
            <Head title="Register" />

            <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full name</Label>
                        <div className="relative">
                            <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                                autoFocus
                                autoComplete="name"
                                className="h-11 pl-10"
                            />
                        </div>
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="username"
                                value={form.data.username}
                                onChange={(event) =>
                                    form.setData('username', event.target.value)
                                }
                                required
                                autoComplete="username"
                                className="h-11 pl-10"
                                placeholder="Use letters, numbers, dashes, or underscores"
                            />
                        </div>
                        <InputError message={form.errors.username} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                required
                                autoComplete="email"
                                className="h-11 pl-10"
                            />
                        </div>
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="clinic_id">Clinic</Label>
                        <Select
                            value={form.data.clinic_id}
                            onValueChange={(value) =>
                                form.setData('clinic_id', value)
                            }
                            required
                        >
                            <SelectTrigger id="clinic_id" className="h-11">
                                <Building2 className="size-4 text-muted-foreground" />
                                <SelectValue placeholder="Select your clinic" />
                            </SelectTrigger>
                            <SelectContent>
                                {clinics.map((clinic) => (
                                    <SelectItem
                                        key={clinic.id}
                                        value={clinic.id.toString()}
                                    >
                                        {clinic.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.clinic_id} />
                        {clinics.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No clinics are currently accepting account
                                requests.
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                            required
                            autoComplete="new-password"
                            className="h-11"
                        />
                        <InputError message={form.errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            value={form.data.password_confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                            required
                            autoComplete="new-password"
                            className="h-11"
                        />
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Checkbox
                            id="privacy-accepted"
                            checked={privacyAccepted}
                            onCheckedChange={(checked) =>
                                setPrivacyAccepted(checked === true)
                            }
                            className="mt-1"
                            required
                        />
                        <Label
                            htmlFor="privacy-accepted"
                            className="font-normal"
                        >
                            I acknowledge and accept the{' '}
                            <PrivacyNoticeDialog
                                trigger="Privacy Notice"
                                triggerClassName="font-medium text-sky-700 underline underline-offset-4 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                                open={privacyDialogOpen}
                                onOpenChange={setPrivacyDialogOpen}
                                onAccept={() => setPrivacyAccepted(true)}
                            />
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={
                            form.processing ||
                            !privacyAccepted ||
                            clinics.length === 0
                        }
                    >
                        {form.processing && <Spinner />}
                        Create account
                    </Button>
                </div>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="font-medium text-primary underline underline-offset-4"
                >
                    Log in
                </Link>
            </p>
        </AuthLayout>
    );
}
