"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { serializePrisma } from "@/lib/serialize"

export async function getDashboardData() {
  const { db } = await getOrgContext()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Run all queries in parallel for maximum speed
  const [
    campaignTotal,
    campaignActive,
    campaignBudget,
    contentTotal,
    contentPublished,
    contentScheduled,
    contentDrafts,
    mentionTotal,
    mentionPositive,
    mentionNegative,
    mentionNeutral,
    leadTotal,
    leadNew,
    leadQualified,
    leadConverted,
    subscriberTotal,
    emailActive,
    recentCampaigns,
    recentContent,
    recentMentions,
  ] = await Promise.all([
    db.campaign.count(),
    db.campaign.count({ where: { status: "ACTIVE" } }),
    db.campaign.aggregate({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      _sum: { budget: true, spentAmount: true },
    }),
    db.content.count(),
    db.content.count({ where: { status: "PUBLISHED" } }),
    db.content.count({ where: { status: "SCHEDULED" } }),
    db.content.count({ where: { status: "DRAFT" } }),
    db.socialMention.count(),
    db.socialMention.count({ where: { sentiment: "POSITIVE" } }),
    db.socialMention.count({ where: { sentiment: "NEGATIVE" } }),
    db.socialMention.count({ where: { sentiment: "NEUTRAL" } }),
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: monthStart } } }),
    db.lead.count({ where: { status: "QUALIFIED" } }),
    db.lead.count({ where: { status: "WON" } }),
    db.emailSubscriber.count({ where: { status: "ACTIVE" } }),
    db.emailCampaign.count({ where: { status: { in: ["SENDING", "SCHEDULED"] } } }),
    db.campaign.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { content: true } } },
    }),
    db.content.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, contentType: true, status: true, createdAt: true },
    }),
    db.socialMention.findMany({
      orderBy: { mentionedAt: "desc" },
      take: 5,
    }),
  ])

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
