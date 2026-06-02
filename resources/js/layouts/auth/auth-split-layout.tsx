import { Link, usePage } from '@inertiajs/react';
import { Factory } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="grid h-dvh lg:grid-cols-2">
            {/* Left side - Form */}
            <div className="flex flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex gap-2 items-start">
                                <div className="p-3 bg-blue-600 text-white rounded-md">
                                    <Factory className='size-5'/>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="font-black text-md text-white">Victory Labs</span>
                                    <span className="text-gray-600 uppercase text-[10px] dark:text-blue-200">ERP Tekstil internal</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {title}
                                </h1>
                                <p className="text-gray-600 text-sm dark:text-blue-200">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
            {/* RIght side - Gradient background with system info */}
            <div className="relative hidden h-full flex-col items-start justify-end bg-linear-to-br from-blue-900 via-purple-900 to-blue-800 p-10 text-white lg:flex overflow-hidden">
                {/* Decorative blur elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-left max-w-2xl">
                    <div className="text-sm font-semibold tracking-widest text-blue-200 mb-2">
                        INTERNAL SYSTEM
                    </div>
                    <h2 className="text-4xl font-bold mb-2 leading-tight">
                        Kelola alur produksi tekstil dari pesanan hingga laba rugi.
                    </h2>
                    <p className="text-blue-200 text-sm max-w-md">
                        Task scheduling, digital job ticket, kanban board, dan tracking realtime
                        untuk seluruh divisi.
                    </p>
                </div>
            </div>
        </div>
    );
}
