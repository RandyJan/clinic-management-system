import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email address to receive a password reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <div className="text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <Form {...email.form()} resetOnSuccess={['email']}>
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                required
                            />
                            <InputError message={errors.email} />
                        </div>

                        <Button className="w-full" disabled={processing}>
                            {processing && <Spinner />}
                            Email password reset link
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
