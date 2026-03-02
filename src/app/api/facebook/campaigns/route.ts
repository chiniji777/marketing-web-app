import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { prisma } from "@/lib/prisma"
import { getCampaigns, createCampaign } from "@/lib/facebook"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  facebookAdAccountId: z.string(),
  name: z.string().min(1).max(200),
  objective: z.enum([
    "OUTCOME_AWARENESS",
    "OUTCOME_TRAFFIC",
    "OUTCOME_ENGAGEMENT",
    "OUTCOME_LEADS",
    "OUTCOME_SALES",
    "OUTCOME_APP_PROMOTION",
  ]),
  dailyBudget: z.number().positive().optional(),
  productId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const fbAdAccountId = searchParams.get("facebookAdAccountId")
  if (!fbAdAccountId) {
    return NextResponse.json({ error: "facebookAdAccountId is required" }, { status: 400 })
  }

  const db = getTenantPrisma(session.user.activeOrganizationId)

  // Get the FB ad account with its social account (for access token)
  const fbAccount = await db.facebookAdAccount.findFirst({
    where: { id: fbAdAccountId, isActive: true },
    include: { socialAccount: true },
  })

  if (!fbAccount) {
    return NextResponse.json({ error: "Facebook Ad Account not found" }, { status: 404 })
  }

  try {
    const campaigns = await getCampaigns(fbAccount.adAccountId, fbAccount.socialAccount.accessToken)
    return NextResponse.json(campaigns)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch campaigns"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { facebookAdAccountId, name, objective, dailyBudget, productId } = parsed.data
  const orgId = session.user.activeOrganizationId
  const db = getTenantPrisma(orgId)

  // Get FB account
  const fbAccount = await db.facebookAdAccount.findFirst({
    where: { id: facebookAdAccountId, isActive: true },
    include: { socialAccount: true },
  })

  if (!fbAccount) {
    return NextResponse.json({ error: "Facebook Ad Account not found" }, { status: 404 })
  }

  try {
    // Create campaign on Facebook
    const fbCampaign = await createCampaign(
      fbAccount.adAccountId,
      fbAccount.socialAccount.accessToken,
      { name, objective, dailyBudget }
    )

    // Save to our database
    const adsCampaign = await prisma.adsCampaign.create({
      data: {
        organizationId: orgId,
        facebookAdAccountId,
        productId: productId || null,
        name,
        platform: "FACEBOOK",
        platformCampaignId: fbCampaign.id,
        status: "PAUSED",
        objective,
        dailyBudget: dailyBudget || null,
      },
    })

    return NextResponse.json(adsCampaign, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create campaign"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
