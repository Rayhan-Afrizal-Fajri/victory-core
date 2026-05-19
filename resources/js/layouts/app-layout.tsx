import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
    title,
    description,
    information,
    actions,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
    title: string;
    description: string;
    information: string;
    actions?: React.ReactNode;
}) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <div className="space-y-8 px-4 py-6 lg:px-8">

                {(title || actions) && (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT CONTENT */}
                        <div className="space-y-2">
                            {information && (
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    {information}
                                </p>
                            )}

                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                {title}
                            </h1>

                            {description && (
                                <p className="max-w-2xl text-sm leading-6 text-slate-500">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* RIGHT ACTIONS */}
                        {actions && (
                            <div className="flex items-center gap-3">
                                {actions}
                            </div>
                        )}
                    </div>
                )}

                {children}
            </div>
        </AppLayoutTemplate>
    );
}