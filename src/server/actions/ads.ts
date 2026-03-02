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

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
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
    include: { adSets: true },
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

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const totalCampaigns = await db.adsCampaign.count()
  const active = await db.adsCampaign.count({ where: { status: "ACTIVE" } })
  // Count ad sets through campaign relation (adsSet has no direct organizationId)
  const campaigns = await db.adsCampaign.findMany({
    select: { totalBudget: true, dailyBudget: true, performanceData: true, _count: { select: { adSets: true } } },
  })
  const totalSets = campaigns.reduce((sum, c) => sum + c._count.adSets, 0)

  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.totalBudget ?? 0), 0)

  // Extract aggregate metrics from performanceData JSON
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

// ─── Ad Sets ─────────────────────────────────────────────────

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
