import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { update } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <AuthLayout
            title="Reset password"
            description="Choose a new password for your clinic account"
        >
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                defaultValue={email}
                                autoComplete="email"
                                required
                                readOnly
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">New password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                autoFocus
                                required
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm new password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                required
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <Button className="w-full" disabled={processing}>
                            {processing && <Spinner />}
                            Reset password
                        </Button>
                    </div>
                )}
            </Form>

            <div className="text-center text-sm text-muted-foreground">
                <span>Return to </span>
                <TextLink href={login()}>log in</TextLink>
            </div>
        </AuthLayout>
    );
}
