import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Form, Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/user-password';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: '/settings/password',
    },
];

export default function Password() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Update password"
                        description="Use a strong password you do not reuse elsewhere"
                    />

                    <Form
                        {...update.form()}
                        resetOnSuccess={[
                            'current_password',
                            'password',
                            'password_confirmation',
                        ]}
                        className="max-w-xl space-y-6"
                    >
                        {({ processing, errors, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        Current password
                                    </Label>
                                    <PasswordInput
                                        id="current_password"
                                        name="current_password"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New password
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
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

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>
                                        {processing && <Spinner />}
                                        Save password
                                    </Button>
                                    {recentlySuccessful && (
                                        <p className="text-sm text-muted-foreground">
                                            Saved.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
