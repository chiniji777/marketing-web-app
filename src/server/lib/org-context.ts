import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantPrisma } from "@/lib/prisma-extension"

/**
 * Get the authenticated user's organization context.
 * If the session doesn't have an activeOrganizationId (e.g., after DB reset),
 * it falls back to finding any existing membership or auto-creating one.
 */
export async function getOrgContext() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  let organizationId = session.user.activeOrganizationId

  if (!organizationId) {
    // Session doesn't have an org — try to find one from the DB
    const membership = await prisma.membership.findFirst({
      where: { userId, isActive: true },
      orderBy: { joinedAt: "desc" },
    })

    if (membership) {
      organizationId = membership.organizationId
    } else {
      // No membership at all — create an org for this user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })

      if (!user?.email) throw new Error("Unauthorized")

      const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-")
      const orgName = user.name ? `${user.name}'s Workspace` : "My Workspace"

      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: `${slug}-${Date.now().toString(36)}`,
        },
      })

      await prisma.membership.create({
        data: {
          userId,
          organizationId: org.id,
          role: "ADMIN",
        },
      })

      organizationId = org.id
    }
  }

  return {
    userId,
    organizationId,
    db: getTenantPrisma(organizationId),
  }
}
