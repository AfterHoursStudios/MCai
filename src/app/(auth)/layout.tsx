import { Suspense } from 'react';

/**
 * Auth Layout
 *
 * Simple layout for authentication pages (login, register).
 * Uses Suspense for useSearchParams in child components.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
