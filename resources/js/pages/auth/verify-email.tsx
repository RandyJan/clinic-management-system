// Components
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { Head } from '@inertiajs/react';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify email"
            description="Verify your email address to continue"
        >
            <Head title="Email verification" />

            <div className="space-y-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Check your inbox and follow the verification link sent to
                    your email address.
                </p>

                <TextLink href={logout()} className="mx-auto block text-sm">
                    Log out
                </TextLink>
            </div>
        </AuthLayout>
    );
}
