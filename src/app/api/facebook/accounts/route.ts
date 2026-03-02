import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !session.user.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = getTenantPrisma(session.user.activeOrganizationId)

  const accounts = await db.facebookAdAccount.findMany({
    where: { isActive: true },
    include: {
      socialAccount: {
        select: {
          accountName: true,
          tokenExpiresAt: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(accounts)
}
