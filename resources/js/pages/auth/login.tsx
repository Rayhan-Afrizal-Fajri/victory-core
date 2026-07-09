import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const testAccounts = [
    { name: 'Owner', role: 'Owner', email: 'owner@victorylabs.id' },
    { name: 'Manager', role: 'Manager', email: 'manager@victorylabs.id' },
    { name: 'Finance', role: 'Finance', email: 'finance@victorylabs.id' },
    { name: 'Designer', role: 'Designer', email: 'designer@victorylabs.id' },
    { name: 'Purchasing', role: 'Purchasing', email: 'purchasing@victorylabs.id' },
    { name: 'Kepala Produksi', role: 'Kepala Produksi', email: 'kepala_produksi@victorylabs.id' },
    { name: 'Admin', role: 'Admin', email: 'admin@victorylabs.id' },
];

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    
    return (
        <>
            <Head title="Log in" />

            {/* Form Login - Sebagai Fokus Utama (Primary Action) */}
            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 mt-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-gray-700 font-semibold dark:text-gray-300">
                                    EMAIL
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="owner@victorylabs.com"
                                    className="px-4 py-3 border border-gray-300 dark:border-gray-600"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-gray-700 font-semibold dark:text-gray-300">
                                    PASSWORD
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="px-4 py-3 border border-gray-300 dark:border-gray-600"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-sm text-base"
                                tabIndex={3}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner className="mr-2" />}
                                Masuk
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {/* Akun Testing - Dipindah ke bawah dan dibuat lebih kompak */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="mb-4 text-center">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Login Cepat (Fase Testing)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Klik *role* di bawah untuk mengisi form otomatis. <br className="hidden sm:block" />
                        Password default: <code className="mx-1 rounded bg-gray-200 px-1.5 py-0.5 font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">password!</code>
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                    {testAccounts.map((account) => (
                        <button
                            key={account.email}
                            type="button"
                            title={`Email: ${account.email}`}
                            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                            onClick={() => {
                                const email = document.getElementById('email') as HTMLInputElement;
                                const password = document.getElementById('password') as HTMLInputElement;

                                if (email && password) {
                                    email.value = account.email;
                                    email.dispatchEvent(new Event('input', { bubbles: true }));

                                    password.value = 'password!';
                                    password.dispatchEvent(new Event('input', { bubbles: true }));
                                    
                                    // Optional UX: Memberikan fokus ke tombol submit setelah diklik
                                    const submitBtn = document.querySelector('[data-test="login-button"]') as HTMLButtonElement;
                                    submitBtn?.focus();
                                }
                            }}
                        >
                            {account.name}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

Login.layout = {
    title: 'Selamat datang kembali',
    description: 'Masuk untuk mengelola produksi dan pesanan Anda.',
};