"use server"

import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import {
  createAdsCampaignSchema,
  updateAdsCampaignSchema,
  createAdsSetSchema,
  type CreateAdsCampaignInput,
  type UpdateAdsCampaignInput,
  type CreateAdsSetInput,
} from "@/server/validators/ads"
import { revalidatePath } from "next/cache"
import { serializePrisma } from "@/lib/serialize"
import {
  getCampaigns as fbGetCampaigns,
  getInsights as fbGetInsights,
  createCampaign as fbCreateCampaign,
  updateCampaign as fbUpdateCampaign,
  getAdSets as fbGetAdSets,
  createAdSet as fbCreateAdSet,
  updateAdSet as fbUpdateAdSet,
  getAds as fbGetAds,
  createAd as fbCreateAd,
  updateAd as fbUpdateAd,
  createAdCreative as fbCreateAdCreative,
  deleteObject as fbDeleteObject,
  getPages as fbGetPages,
} from "@/lib/facebook"

async function getOrgContext() {
  const session = await auth()
  if (!session?.user?.id || !session.user.activeOrganizationId) {
    throw new Error("Unauthorized")
  }
  return {
    userId: session.user.id,
    organizationId: session.user.activeOrganizationId,
    db: getTenantPrisma(session.user.activeOrganizationId),
  }
}

// ─── Ad Campaigns ────────────────────────────────────────────

export async function getAdsCampaigns(filters?: {
  platform?: string
  status?: string
  search?: string
  page?: number
  perPage?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.platform) where.platform = filters.platform
  if (filters?.status) where.status = filters.status
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" }
  }

  const campaigns = await db.adsCampaign.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: perPage,
    include: { adSets: { select: { id: true, name: true, metrics: true, status: true } } },
  })
  const total = await db.adsCampaign.count({ where })

  return { campaigns: serializePrisma(campaigns), pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

export async function getAdsCampaign(id: string) {
  const { db } = await getOrgContext()
  const campaign = await db.adsCampaign.findFirst({
    where: { id },
    include: {
      adSets: true,
      facebookAdAccount: {
        select: {
          id: true,
          adAccountId: true,
          adAccountName: true,
          currency: true,
          timezone: true,
          businessName: true,
        },
      },
    },
  })
  return campaign ? serializePrisma(campaign) : null
}

export async function createAdsCampaign(input: CreateAdsCampaignInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createAdsCampaignSchema.parse(input)

  const campaign = await db.adsCampaign.create({
    data: {
      organizationId,
      name: parsed.name,
      platform: parsed.platform,
      objective: parsed.objective,
      dailyBudget: parsed.dailyBudget,
      totalBudget: parsed.totalBudget,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      targetAudience: parsed.targetAudience ? { description: parsed.targetAudience } : undefined,
    },
  })

  revalidatePath("/ads")
  return serializePrisma(campaign)
}

export async function updateAdsCampaign(input: UpdateAdsCampaignInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateAdsCampaignSchema.parse(input)

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.status !== undefined) updateData.status = data.status
  if (data.dailyBudget !== undefined) updateData.dailyBudget = data.dailyBudget
  if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null

  const campaign = await db.adsCampaign.update({ where: { id }, data: updateData })

  revalidatePath("/ads")
  return serializePrisma(campaign)
}

export async function deleteAdsCampaign(id: string) {
  const { db } = await getOrgContext()
  await db.adsCampaign.delete({ where: { id } })
  revalidatePath("/ads")
}

export async function getAdsStats() {
  const { db } = await getOrgContext()

  const totalCampaigns = await db.adsCampaign.count()
  const active = await db.adsCampaign.count({ where: { status: "ACTIVE" } })
  const campaigns = await db.adsCampaign.findMany({
    select: { totalBudget: true, dailyBudget: true, performanceData: true, _count: { select: { adSets: true } } },
  })
  const totalSets = campaigns.reduce((sum, c) => sum + c._count.adSets, 0)
  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.totalBudget ?? 0), 0)

  let totalSpend = 0
  let totalImpressions = 0
  let totalClicks = 0
  let totalConversions = 0

  for (const c of campaigns) {
    const perf = c.performanceData as Record<string, number> | null
    if (perf) {
      totalSpend += Number(perf.spend ?? 0)
      totalImpressions += Number(perf.impressions ?? 0)
      totalClicks += Number(perf.clicks ?? 0)
      totalConversions += Number(perf.conversions ?? 0)
    }
  }

  return {
    totalCampaigns,
    active,
    totalSets,
    totalSpend,
    totalBudget,
    totalImpressions,
    totalClicks,
    totalConversions,
    ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    conversionRate: totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0,
  }
}

// ─── Ad Sets (Local) ─────────────────────────────────────────

export async function createAdsSet(input: CreateAdsSetInput) {
  const { db } = await getOrgContext()
  const parsed = createAdsSetSchema.parse(input)

  const set = await db.adsSet.create({
    data: {
      adsCampaignId: parsed.adsCampaignId,
      name: parsed.name,
      targetAudience: parsed.targetAudience ? { description: parsed.targetAudience } : {},
      budget: parsed.budget,
      bidAmount: parsed.bidAmount,
    },
  })

  revalidatePath("/ads")
  return serializePrisma(set)
}

export async function deleteAdsSet(id: string) {
  const { db } = await getOrgContext()
  await db.adsSet.delete({ where: { id } })
  revalidatePath("/ads")
}

// ─── Facebook Account Management ─────────────────────────────

export async function getFacebookAdAccounts() {
  const { db } = await getOrgContext()

  const accounts = await db.facebookAdAccount.findMany({
    where: { isActive: true },
    include: {
      socialAccount: {
        select: {
          accountName: true,
          tokenExpiresAt: true,
          isActive: true,
          accessToken: false,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return serializePrisma(accounts)
}

export async function disconnectFacebookAdAccount(id: string) {
  const { db } = await getOrgContext()

  await db.facebookAdAccount.update({
    where: { id },
    data: { isActive: false },
  })

  revalidatePath("/ads")
  return { success: true }
}

// ─── Facebook Helpers ────────────────────────────────────────

async function getFbAccessToken(db: ReturnType<typeof getTenantPrisma>, fbAdAccountId: string) {
  const fbAccount = await db.facebookAdAccount.findFirst({
    where: { id: fbAdAccountId, isActive: true },
    include: { socialAccount: { select: { accessToken: true } } },
  })
  if (!fbAccount) throw new Error("Facebook Ad Account not found or disconnected")
  return { adAccountId: fbAccount.adAccountId, accessToken: fbAccount.socialAccount.accessToken }
}

async function getFbAccessTokenByCampaignId(db: ReturnType<typeof getTenantPrisma>, campaignId: string) {
  const campaign = await db.adsCampaign.findFirst({
    where: { id: campaignId },
  })
  if (!campaign || !campaign.platformCampaignId || !campaign.facebookAdAccountId) {
    throw new Error("Campaign not found or not linked to Facebook")
  }
  const { adAccountId, accessToken } = await getFbAccessToken(db, campaign.facebookAdAccountId)
  return { campaign, adAccountId, accessToken }
}

// ─── Facebook Campaign Sync ─────────────────────────────────

export async function syncFacebookCampaigns(fbAdAccountId: string) {
  const { organizationId, db } = await getOrgContext()
  const { adAccountId, accessToken } = await getFbAccessToken(db, fbAdAccountId)

  const fbCampaigns = await fbGetCampaigns(adAccountId, accessToken)

  const existingCampaigns = await db.adsCampaign.findMany({
    where: { facebookAdAccountId: fbAdAccountId, platformCampaignId: { not: null } },
    select: { id: true, platformCampaignId: true },
  })
  const existingMap = new Map(existingCampaigns.map((c) => [c.platformCampaignId, c.id]))

  let synced = 0
  let created = 0

  for (const fbCampaign of fbCampaigns) {
    const localId = existingMap.get(fbCampaign.id)
    const statusMap: Record<string, string> = {
      ACTIVE: "ACTIVE",
      PAUSED: "PAUSED",
      DELETED: "COMPLETED",
      ARCHIVED: "COMPLETED",
    }
    const localStatus = statusMap[fbCampaign.status] || "DRAFT"

    if (localId) {
      await db.adsCampaign.update({
        where: { id: localId },
        data: {
          name: fbCampaign.name,
          status: localStatus as "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "PAUSED" | "COMPLETED" | "REJECTED",
          objective: fbCampaign.objective,
          dailyBudget: fbCampaign.dailyBudget ?? undefined,
        },
      })
      synced++
    } else {
      await db.adsCampaign.create({
        data: {
          organizationId,
          facebookAdAccountId: fbAdAccountId,
          name: fbCampaign.name,
          platform: "FACEBOOK",
          platformCampaignId: fbCampaign.id,
          status: localStatus as "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "PAUSED" | "COMPLETED" | "REJECTED",
          objective: fbCampaign.objective,
          dailyBudget: fbCampaign.dailyBudget ?? undefined,
        },
      })
      created++
    }
  }

  revalidatePath("/ads")
  return { synced, created, total: fbCampaigns.length }
}

export async function createFacebookCampaign(input: {
  facebookAdAccountId: string
  name: string
  objective: string
  dailyBudget?: number
  productId?: string
}) {
  const { organizationId, db } = await getOrgContext()
  const { adAccountId, accessToken } = await getFbAccessToken(db, input.facebookAdAccountId)

  const fbResult = await fbCreateCampaign(adAccountId, accessToken, {
    name: input.name,
    objective: input.objective,
    dailyBudget: input.dailyBudget,
  })

  const campaign = await db.adsCampaign.create({
    data: {
      organizationId,
      facebookAdAccountId: input.facebookAdAccountId,
      productId: input.productId || null,
      name: input.name,
      platform: "FACEBOOK",
      platformCampaignId: fbResult.id,
      status: "PAUSED",
      objective: input.objective,
      dailyBudget: input.dailyBudget ?? null,
    },
  })

  revalidatePath("/ads")
  return serializePrisma(campaign)
}

export async function updateFacebookCampaign(
  campaignId: string,
  updates: { name?: string; status?: "ACTIVE" | "PAUSED"; dailyBudget?: number }
) {
  const { db } = await getOrgContext()
  const { campaign, accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  await fbUpdateCampaign(campaign.platformCampaignId!, accessToken, {
    name: updates.name,
    status: updates.status,
    dailyBudget: updates.dailyBudget,
  })

  const updateData: Record<string, unknown> = {}
  if (updates.name) updateData.name = updates.name
  if (updates.status) updateData.status = updates.status
  if (updates.dailyBudget) updateData.dailyBudget = updates.dailyBudget

  await db.adsCampaign.update({ where: { id: campaignId }, data: updateData })

  revalidatePath("/ads")
  return { success: true }
}

export async function updateFacebookCampaignStatus(campaignId: string, newStatus: "ACTIVE" | "PAUSED") {
  return updateFacebookCampaign(campaignId, { status: newStatus })
}

export async function deleteFacebookCampaign(campaignId: string) {
  const { db } = await getOrgContext()
  const { campaign, accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  await fbDeleteObject(campaign.platformCampaignId!, accessToken)
  await db.adsCampaign.delete({ where: { id: campaignId } })

  revalidatePath("/ads")
  return { success: true }
}

// ─── Facebook Campaign Insights ──────────────────────────────

export async function getFacebookCampaignInsights(campaignId: string, timeRange?: { since: string; until: string }) {
  const { db } = await getOrgContext()
  const { campaign, accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  const insights = await fbGetInsights(campaign.platformCampaignId!, accessToken, {
    timeRange,
  })

  if (insights.length > 0) {
    const latest = insights[0]
    await db.adsCampaign.update({
      where: { id: campaignId },
      data: {
        performanceData: {
          impressions: latest.impressions,
          clicks: latest.clicks,
          spend: latest.spend,
          cpc: latest.cpc,
          cpm: latest.cpm,
          ctr: latest.ctr,
          reach: latest.reach,
          conversions: latest.actions.reduce((sum, a) => sum + a.value, 0),
          lastSynced: new Date().toISOString(),
        },
      },
    })
  }

  revalidatePath("/ads")
  return insights
}

export async function getFacebookCampaignDailyInsights(campaignId: string, days: number = 30) {
  const { db } = await getOrgContext()
  const { campaign, accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  const until = new Date()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const insights = await fbGetInsights(campaign.platformCampaignId!, accessToken, {
    timeRange: {
      since: since.toISOString().split("T")[0],
      until: until.toISOString().split("T")[0],
    },
    timeIncrement: "1",
  })

  return insights
}

// ─── Facebook Ad Sets ────────────────────────────────────────

export async function getFacebookAdSets(campaignId: string) {
  const { db } = await getOrgContext()
  const { campaign, accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  const adSets = await fbGetAdSets(campaign.platformCampaignId!, accessToken)
  return adSets
}

export async function createFacebookAdSet(input: {
  campaignId: string
  name: string
  dailyBudget?: number
  billingEvent?: string
  optimizationGoal?: string
  targeting: Record<string, unknown>
  startTime?: string
}) {
  const { db } = await getOrgContext()
  const { campaign, adAccountId, accessToken } = await getFbAccessTokenByCampaignId(db, input.campaignId)

  const fbResult = await fbCreateAdSet(adAccountId, accessToken, {
    name: input.name,
    campaignId: campaign.platformCampaignId!,
    dailyBudget: input.dailyBudget,
    billingEvent: input.billingEvent,
    optimizationGoal: input.optimizationGoal,
    targeting: input.targeting,
    startTime: input.startTime,
  })

  // Also save locally
  await db.adsSet.create({
    data: {
      adsCampaignId: input.campaignId,
      name: input.name,
      platformAdSetId: fbResult.id,
      targetAudience: input.targeting as Record<string, string | number | boolean | null>,
      budget: input.dailyBudget,
      status: "PAUSED",
    },
  })

  revalidatePath("/ads")
  return { id: fbResult.id }
}

export async function updateFacebookAdSetStatus(adSetPlatformId: string, campaignId: string, newStatus: "ACTIVE" | "PAUSED") {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  await fbUpdateAdSet(adSetPlatformId, accessToken, { status: newStatus })

  // Update local record if exists
  const localSet = await db.adsSet.findFirst({
    where: { platformAdSetId: adSetPlatformId },
  })
  if (localSet) {
    await db.adsSet.update({
      where: { id: localSet.id },
      data: { status: newStatus },
    })
  }

  revalidatePath("/ads")
  return { success: true }
}

export async function deleteFacebookAdSet(adSetPlatformId: string, campaignId: string) {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  await fbDeleteObject(adSetPlatformId, accessToken)

  // Delete local record if exists
  const localSet = await db.adsSet.findFirst({
    where: { platformAdSetId: adSetPlatformId },
  })
  if (localSet) {
    await db.adsSet.delete({ where: { id: localSet.id } })
  }

  revalidatePath("/ads")
  return { success: true }
}

export async function getFacebookAdSetInsights(adSetPlatformId: string, campaignId: string) {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  const insights = await fbGetInsights(adSetPlatformId, accessToken)
  return insights
}

// ─── Facebook Ads ────────────────────────────────────────────

export async function getFacebookAds(adSetPlatformId: string, campaignId: string) {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  const ads = await fbGetAds(adSetPlatformId, accessToken)
  return ads
}

export async function createFacebookAd(input: {
  campaignId: string
  adSetPlatformId: string
  name: string
  pageId: string
  message?: string
  link?: string
  imageHash?: string
  callToActionType?: string
}) {
  const { db } = await getOrgContext()
  const { adAccountId, accessToken } = await getFbAccessTokenByCampaignId(db, input.campaignId)

  // Create creative first
  const creative = await fbCreateAdCreative(adAccountId, accessToken, {
    name: `Creative - ${input.name}`,
    pageId: input.pageId,
    message: input.message,
    link: input.link,
    imageHash: input.imageHash,
    callToAction: input.callToActionType && input.link
      ? { type: input.callToActionType, value: { link: input.link } }
      : undefined,
  })

  // Create ad using the creative
  const ad = await fbCreateAd(adAccountId, accessToken, {
    name: input.name,
    adSetId: input.adSetPlatformId,
    creativeId: creative.id,
  })

  revalidatePath("/ads")
  return { id: ad.id, creativeId: creative.id }
}

export async function updateFacebookAdStatus(adPlatformId: string, campaignId: string, newStatus: "ACTIVE" | "PAUSED") {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  await fbUpdateAd(adPlatformId, accessToken, { status: newStatus })

  revalidatePath("/ads")
  return { success: true }
}

export async function deleteFacebookAd(adPlatformId: string, campaignId: string) {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  await fbDeleteObject(adPlatformId, accessToken)

  revalidatePath("/ads")
  return { success: true }
}

// ─── Facebook Pages ──────────────────────────────────────────

export async function getFacebookPages(fbAdAccountId: string) {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessToken(db, fbAdAccountId)

  const pages = await fbGetPages(accessToken)
  return pages
}

// ─── Facebook Ad Insights (per ad) ──────────────────────────

export async function getFacebookAdInsights(adPlatformId: string, campaignId: string) {
  const { db } = await getOrgContext()
  const { accessToken } = await getFbAccessTokenByCampaignId(db, campaignId)

  const insights = await fbGetInsights(adPlatformId, accessToken)
  return insights
}
