"use server"

import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
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

export async function getDashboardData() {
  const { db } = await getOrgContext()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Run queries sequentially to avoid overwhelming connection pool (local Prisma Postgres has connection_limit=1)
  const campaignTotal = await db.campaign.count()
  const campaignActive = await db.campaign.count({ where: { status: "ACTIVE" } })
  const campaignBudget = await db.campaign.aggregate({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    _sum: { budget: true, spentAmount: true },
  })
  const contentTotal = await db.content.count()
  const contentPublished = await db.content.count({ where: { status: "PUBLISHED" } })
  const contentScheduled = await db.content.count({ where: { status: "SCHEDULED" } })
  const contentDrafts = await db.content.count({ where: { status: "DRAFT" } })
  const mentionTotal = await db.socialMention.count()
  const mentionPositive = await db.socialMention.count({ where: { sentiment: "POSITIVE" } })
  const mentionNegative = await db.socialMention.count({ where: { sentiment: "NEGATIVE" } })
  const mentionNeutral = await db.socialMention.count({ where: { sentiment: "NEUTRAL" } })
  const leadTotal = await db.lead.count()
  const leadNew = await db.lead.count({ where: { createdAt: { gte: monthStart } } })
  const leadQualified = await db.lead.count({ where: { status: "QUALIFIED" } })
  const leadConverted = await db.lead.count({ where: { status: "WON" } })
  const subscriberTotal = await db.emailSubscriber.count({ where: { status: "ACTIVE" } })
  const emailActive = await db.emailCampaign.count({ where: { status: { in: ["SENDING", "SCHEDULED"] } } })
  const recentCampaigns = await db.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { _count: { select: { content: true } } },
  })
  const recentContent = await db.content.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, contentType: true, status: true, createdAt: true },
  })
  const recentMentions = await db.socialMention.findMany({
    orderBy: { mentionedAt: "desc" },
    take: 5,
  })

  return {
    campaigns: {
      total: campaignTotal,
      active: campaignActive,
      totalBudget: Number(campaignBudget._sum.budget ?? 0),
      totalSpent: Number(campaignBudget._sum.spentAmount ?? 0),
    },
    content: {
      total: contentTotal,
      published: contentPublished,
      scheduled: contentScheduled,
      drafts: contentDrafts,
    },
    mentions: {
      total: mentionTotal,
      positive: mentionPositive,
      negative: mentionNegative,
      neutral: mentionNeutral,
    },
    leads: {
      total: leadTotal,
      newThisMonth: leadNew,
      qualified: leadQualified,
      converted: leadConverted,
    },
    email: {
      totalSubscribers: subscriberTotal,
      activeCampaigns: emailActive,
    },
    recentCampaigns: serializePrisma(recentCampaigns),
    recentContent,
    recentMentions,
  }
}
