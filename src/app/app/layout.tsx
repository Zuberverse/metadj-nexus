import { AuthenticatedAppLayout } from '@/components/layout/AuthenticatedAppLayout';

/**
 * App Layout
 *
 * Protected layout for authenticated users.
 * Loads the main application experience.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
