import { AuthenticatedAppLayout } from "@/components/layout/AuthenticatedAppLayout"

/**
 * Experience Layout
 *
 * Protected layout for authenticated users only.
 * Redirects unauthenticated users to the landing page.
 */
export default async function ExperienceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
}
