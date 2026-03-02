"use server"

import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import {
  connectSocialAccountSchema,
  schedulePostSchema,
  type ConnectSocialAccountInput,
  type SchedulePostInput,
} from "@/server/validators/social"
import { revalidatePath } from "next/cache"

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

// ─── Social Accounts ─────────────────────────────────────────

export async function getSocialAccounts() {
  const { db } = await getOrgContext()
  return db.socialAccount.findMany({
    orderBy: { createdAt: "desc" },
  })
}

export async function connectSocialAccount(input: ConnectSocialAccountInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = connectSocialAccountSchema.parse(input)

  const account = await db.socialAccount.create({
    data: {
      platform: parsed.platform,
      platformAccountId: parsed.platformAccountId,
      accountName: parsed.accountName,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenExpiresAt: parsed.tokenExpiresAt ? new Date(parsed.tokenExpiresAt) : undefined,
      metadata: parsed.metadata ? JSON.parse(JSON.stringify(parsed.metadata)) : undefined,
      organizationId,
    },
  })

  revalidatePath("/settings/integrations")
  revalidatePath("/social-listening")
  return account
}

export async function disconnectSocialAccount(id: string) {
  const { db } = await getOrgContext()
  await db.socialAccount.update({
    where: { id },
    data: { isActive: false },
  })
  revalidatePath("/settings/integrations")
  revalidatePath("/social-listening")
}

export async function deleteSocialAccount(id: string) {
  const { db } = await getOrgContext()
  await db.socialAccount.delete({ where: { id } })
  revalidatePath("/settings/integrations")
}

// ─── Mentions ────────────────────────────────────────────────

export async function getMentions(filters?: {
  platform?: string
  sentiment?: string
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
  if (filters?.sentiment) where.sentiment = filters.sentiment
  if (filters?.search) {
    where.OR = [
      { content: { contains: filters.search, mode: "insensitive" } },
      { authorName: { contains: filters.search, mode: "insensitive" } },
      { authorHandle: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const mentions = await db.socialMention.findMany({
    where,
    orderBy: { mentionedAt: "desc" },
    skip,
    take: perPage,
  })
  const total = await db.socialMention.count({ where })

  return {
    mentions,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  }
}

export async function getMentionStats() {
  const { db } = await getOrgContext()

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const total = await db.socialMention.count()
  const positive = await db.socialMention.count({ where: { sentiment: "POSITIVE" } })
  const negative = await db.socialMention.count({ where: { sentiment: "NEGATIVE" } })
  const neutral = await db.socialMention.count({ where: { sentiment: "NEUTRAL" } })
  const mixed = await db.socialMention.count({ where: { sentiment: "MIXED" } })

  const recentMentions = await db.socialMention.findMany({
    orderBy: { mentionedAt: "desc" },
    take: 5,
  })

  const platformCounts = await db.socialMention.groupBy({
    by: ["platform"],
    _count: { id: true },
  })

  return {
    total,
    sentiment: { positive, negative, neutral, mixed },
    recentMentions,
    platformCounts: platformCounts.map((p) => ({
      platform: p.platform,
      count: p._count.id,
    })),
  }
}

// ─── Post Scheduling ─────────────────────────────────────────

export async function schedulePost(input: SchedulePostInput) {
  const { db } = await getOrgContext()
  const parsed = schedulePostSchema.parse(input)

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const posts = []
  for (const socialAccountId of parsed.socialAccountIds) {
    const post = await db.contentPost.create({
      data: {
        contentId: parsed.contentId,
        socialAccountId,
        scheduledAt: new Date(parsed.scheduledAt),
        status: "SCHEDULED",
      },
    })
    posts.push(post)
  }

  revalidatePath("/content/calendar")
  revalidatePath("/content")
  return posts
}

export async function getScheduledPosts(filters?: {
  status?: string
  from?: string
  to?: string
}) {
  const { db } = await getOrgContext()

  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.from || filters?.to) {
    where.scheduledAt = {
      ...(filters?.from ? { gte: new Date(filters.from) } : {}),
      ...(filters?.to ? { lte: new Date(filters.to) } : {}),
    }
  }

  return db.contentPost.findMany({
    where,
    include: {
      content: { select: { id: true, title: true, contentType: true, body: true } },
      socialAccount: { select: { id: true, platform: true, accountName: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

export async function cancelScheduledPost(id: string) {
  const { db } = await getOrgContext()
  await db.contentPost.update({
    where: { id },
    data: { status: "PENDING" },
  })
  revalidatePath("/content/calendar")
}

export async function deleteScheduledPost(id: string) {
  const { db } = await getOrgContext()
  await db.contentPost.delete({ where: { id } })
  revalidatePath("/content/calendar")
}
