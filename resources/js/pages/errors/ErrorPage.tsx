import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  code: string | number;
  title: string;
  description: string;
  help?: string;
  dashboardHref?: string;
}

export default function ErrorPage({
  code,
  title,
  description,
  help,
  dashboardHref = '/dashboard',
}: ErrorPageProps) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center py-8">
      <div className="w-full max-w-4xl rounded-4xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              Error {code}
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              {description}
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              Quick actions
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href={dashboardHref} className="w-full sm:w-auto">
                <Button className="w-full cursor-pointer">Back to dashboard</Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto cursor-pointer"
                onClick={() => window.history.back()}
              >
                Go back
              </Button>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              If you landed here unexpectedly, try returning to the dashboard or navigate back to the previous page.
            </p>
          </div>
        </div>

        {help ? (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            {help}
          </div>
        ) : null}
      </div>
    </div>
  );
}
