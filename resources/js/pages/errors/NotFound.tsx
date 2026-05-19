import { Head, setLayoutProps } from '@inertiajs/react';
import ErrorPage from '@/pages/errors/ErrorPage';

export default function NotFound() {
//   setLayoutProps({
//     title: 'Page not found',
//     description: 'The page you are looking for does not exist or has been moved.',
//     information: '404 — Not Found',
//   });

  return (
    <>
      <Head title="404 Not Found" />

      <ErrorPage
        code="404"
        title="Oops! This page can’t be found."
        description="We couldn’t find the page you were looking for. Check the address or try one of the options below."
      />
    </>
  );
}
