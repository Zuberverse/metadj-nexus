import { redirect } from "next/navigation"
import { MetaDJNexusGuide } from "@/components/guide/MetaDJNexusGuide"
import { getSession } from "@/lib/auth"

/**
 * Guide Page
 *
 * Protected page that requires authentication.
 * Redirects unauthenticated users to the landing page.
 */
export default async function GuidePage() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return <MetaDJNexusGuide />
}
