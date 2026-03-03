"use server"

import { getOrgContext } from "@/server/lib/org-context"
import {
  createCampaignSchema,
  updateCampaignSchema,
  addCampaignAnalyticsSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type AddCampaignAnalyticsInput,
} from "@/server/validators/campaign"
import { revalidatePath } from "next/cache"
import { serializePrisma } from "@/lib/serialize"

// ─── Campaign CRUD ──────────────────────────────────────────

export async function getCampaigns(filters?: {
  status?: string
  type?: string
  search?: string
  page?: number
  perPage?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.type) where.type = filters.type
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const campaigns = await db.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
    include: {
      _count: { select: { content: true, analytics: true } },
    },
  })
  const total = await db.campaign.count({ where })

  return {
    campaigns: serializePrisma(campaigns),
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  }
}

export async function getCampaign(id: string) {
  const { db } = await getOrgContext()

  const campaign = await db.campaign.findFirst({
    where: { id },
    include: {
      content: {
        select: { id: true, title: true, contentType: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      analytics: {
        orderBy: { date: "desc" },
        take: 30,
      },
      _count: { select: { content: true, analytics: true, adsCampaigns: true, emailCampaigns: true } },
    },
  })

  if (!campaign) throw new Error("Campaign not found")
  return serializePrisma(campaign)
}

export async function createCampaign(input: CreateCampaignInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createCampaignSchema.parse(input)

  const campaign = await db.campaign.create({
    data: {
      organizationId,
      name: parsed.name,
      description: parsed.description,
      type: parsed.type,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      budget: parsed.budget,
      goalType: parsed.goalType,
      goalTarget: parsed.goalTarget,
      channels: parsed.channels,
      metadata: parsed.metadata ? JSON.parse(JSON.stringify(parsed.metadata)) : undefined,
    },
  })

  revalidatePath("/campaigns")
  return serializePrisma(campaign)
}

export async function updateCampaign(input: UpdateCampaignInput) {
  const { db } = await getOrgContext()
  const parsed = updateCampaignSchema.parse(input)
  const { id, ...data } = parsed

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.status !== undefined) updateData.status = data.status
  if (data.type !== undefined) updateData.type = data.type
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
  if (data.budget !== undefined) updateData.budget = data.budget
  if (data.goalType !== undefined) updateData.goalType = data.goalType
  if (data.goalTarget !== undefined) updateData.goalTarget = data.goalTarget
  if (data.goalCurrent !== undefined) updateData.goalCurrent = data.goalCurrent
  if (data.channels !== undefined) updateData.channels = data.channels
  if (data.metadata !== undefined) updateData.metadata = data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined

  const campaign = await db.campaign.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/campaigns")
  revalidatePath(`/campaigns/${id}`)
  return serializePrisma(campaign)
}

export async function deleteCampaign(id: string) {
  const { db } = await getOrgContext()
  await db.campaign.delete({ where: { id } })
  revalidatePath("/campaigns")
}

export async function duplicateCampaign(id: string) {
  const { organizationId, db } = await getOrgContext()

  const original = await db.campaign.findFirst({ where: { id } })
  if (!original) throw new Error("Campaign not found")

  const campaign = await db.campaign.create({
    data: {
      organizationId,
      name: `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      budget: original.budget,
      goalType: original.goalType,
      goalTarget: original.goalTarget,
      channels: original.channels,
      metadata: original.metadata ? JSON.parse(JSON.stringify(original.metadata)) : undefined,
      status: "DRAFT",
    },
  })

  revalidatePath("/campaigns")
  return serializePrisma(campaign)
}

// ─── Campaign Analytics ─────────────────────────────────────

export async function getCampaignAnalytics(campaignId: string, days = 30) {
  const { db } = await getOrgContext()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const analytics = await db.campaignAnalytics.findMany({
    where: {
      campaignId,
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  })
  return serializePrisma(analytics)
}

export async function addCampaignAnalytics(input: AddCampaignAnalyticsInput) {
  const { db } = await getOrgContext()
  const parsed = addCampaignAnalyticsSchema.parse(input)

  const analytics = await db.campaignAnalytics.upsert({
    where: {
      campaignId_date: {
        campaignId: parsed.campaignId,
        date: new Date(parsed.date),
      },
    },
    update: {
      impressions: parsed.impressions,
      clicks: parsed.clicks,
      conversions: parsed.conversions,
      spend: parsed.spend,
      revenue: parsed.revenue,
      engagements: parsed.engagements,
      reach: parsed.reach,
    },
    create: {
      campaignId: parsed.campaignId,
      date: new Date(parsed.date),
      impressions: parsed.impressions,
      clicks: parsed.clicks,
      conversions: parsed.conversions,
      spend: parsed.spend,
      revenue: parsed.revenue,
      engagements: parsed.engagements,
      reach: parsed.reach,
    },
  })

  revalidatePath(`/campaigns/${parsed.campaignId}`)
  return serializePrisma(analytics)
}

export async function getCampaignSummary() {
  const { db } = await getOrgContext()

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const total = await db.campaign.count()
  const active = await db.campaign.count({ where: { status: "ACTIVE" } })
  const draft = await db.campaign.count({ where: { status: "DRAFT" } })
  const completed = await db.campaign.count({ where: { status: "COMPLETED" } })

  const activeCampaigns = await db.campaign.findMany({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      _count: { select: { content: true } },
    },
  })

  // Aggregate analytics for active campaigns
  const totalBudget = await db.campaign.aggregate({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    _sum: { budget: true, spentAmount: true },
  })

  return {
    total,
    active,
    draft,
    completed,
    activeCampaigns: serializePrisma(activeCampaigns),
    totalBudget: Number(totalBudget._sum.budget ?? 0),
    totalSpent: Number(totalBudget._sum.spentAmount ?? 0),
  }
}
