import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import FormSignature from '@/components/ui/form-signature';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number
    name: string
    email: string
    signature?: string | null
    signature_url?: string | null
}

export default function Profile({
    mustVerifyEmail,
    status,
    info
}: {
    mustVerifyEmail: boolean;
    status?: string;
    info?: string;
}) {
    const { auth } = usePage<{
        auth: {
            user: User
        }
    }>().props
    const [signature, setSignature] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(
        auth.user.signature_url ?? null
    )

    const { data, setData, put, errors } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        signature: null, // Ini untuk menampung base64 baru
    });

    useEffect(() => {
        if (info) {
            toast.info(info);
        }
    }, [info])
    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="grid gap-2">
                                    <FormSignature
                                        label="Tanda tangan"
                                        value={preview}
                                        onChange={(value) => {
                                            setData('signature', value);
                                            setSignature(value)   // base64 untuk submit
                                            setPreview(value)     // preview realtime
                                        }}
                                    />

                                    <input
                                        type="hidden"
                                        name="signature"
                                        value={signature ?? ""}
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.signature}
                                    />
                                </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to resend the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
