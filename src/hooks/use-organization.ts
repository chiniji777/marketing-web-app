"use client"

import { useSession } from "next-auth/react"
import { useCallback } from "react"

export function useOrganization() {
  const { data: session, update } = useSession()

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      await update({ activeOrganizationId: organizationId })
      window.location.reload()
    },
    [update]
  )

  return {
    organizationId: session?.user?.activeOrganizationId,
    organizationName: session?.user?.activeOrganizationName,
    organizationSlug: session?.user?.activeOrganizationSlug,
    role: session?.user?.activeRole,
    switchOrganization,
  }
}
