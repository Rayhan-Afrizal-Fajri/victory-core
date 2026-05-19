import { Head, setLayoutProps } from '@inertiajs/react';
import ErrorPage from '@/pages/errors/ErrorPage';

export default function ServerError() {
  setLayoutProps({
    title: 'Server error',
    description: 'Something went wrong on our side. Refresh the page or return to the dashboard.',
    information: '500 — Internal Server Error',
  });

  return (
    <>
      <Head title="500 Server Error" />

      <ErrorPage
        code="500"
        title="Something went wrong."
        description="The server encountered an unexpected condition. We’re working on it, but you can go back to a safe page for now."
        help="Try refreshing or returning to the dashboard. If this keeps happening, contact your administrator."
      />
    </>
  );
}
