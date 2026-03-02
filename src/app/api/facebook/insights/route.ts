import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { getInsights } from "@/lib/facebook"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const campaignId = searchParams.get("campaignId")
  const facebookAdAccountId = searchParams.get("facebookAdAccountId")
  const since = searchParams.get("since")
  const until = searchParams.get("until")

  if (!facebookAdAccountId) {
    return NextResponse.json({ error: "facebookAdAccountId is required" }, { status: 400 })
  }

  const db = getTenantPrisma(session.user.activeOrganizationId)

  const fbAccount = await db.facebookAdAccount.findFirst({
    where: { id: facebookAdAccountId, isActive: true },
    include: { socialAccount: true },
  })

  if (!fbAccount) {
    return NextResponse.json({ error: "Facebook Ad Account not found" }, { status: 404 })
  }

  try {
    // If campaignId provided, get insights for that campaign; otherwise for the whole account
    const objectId = campaignId || fbAccount.adAccountId
    const insights = await getInsights(objectId, fbAccount.socialAccount.accessToken, {
      timeRange: since && until ? { since, until } : undefined,
      timeIncrement: "1",
    })

    return NextResponse.json(insights)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch insights"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
