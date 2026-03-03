"use server"

import { getOrgContext } from "@/server/lib/org-context"
import {
  addKeywordSchema,
  runAuditSchema,
  type AddKeywordInput,
  type RunAuditInput,
} from "@/server/validators/seo"
import { revalidatePath } from "next/cache"

// ─── Keywords ────────────────────────────────────────────────

export async function getKeywords(filters?: {
  search?: string
  page?: number
  perPage?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 50
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.search) {
    where.keyword = { contains: filters.search, mode: "insensitive" }
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const keywords = await db.keyword.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
    include: {
      rankHistory: { orderBy: { checkedAt: "desc" }, take: 7 },
    },
  })
  const total = await db.keyword.count({ where })

  return { keywords, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

export async function addKeyword(input: AddKeywordInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = addKeywordSchema.parse(input)

  const keyword = await db.keyword.create({
    data: {
      organizationId,
      keyword: parsed.keyword,
      targetUrl: parsed.targetUrl,
    },
  })

  revalidatePath("/seo/keywords")
  return keyword
}

export async function deleteKeyword(id: string) {
  const { db } = await getOrgContext()
  await db.keyword.delete({ where: { id } })
  revalidatePath("/seo/keywords")
}

export async function getSeoStats() {
  const { db } = await getOrgContext()

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const totalKeywords = await db.keyword.count()
  const totalAudits = await db.seoAudit.count()
  const recentAudit = await db.seoAudit.findFirst({ orderBy: { createdAt: "desc" } })

  const keywordsWithRank = await db.keyword.findMany({
    where: { currentRank: { not: null } },
    select: { currentRank: true, previousRank: true },
  })

  const avgRank = keywordsWithRank.length > 0
    ? Math.round(keywordsWithRank.reduce((sum, k) => sum + (k.currentRank ?? 0), 0) / keywordsWithRank.length)
    : 0

  const improved = keywordsWithRank.filter(
    (k) => k.previousRank && k.currentRank && k.currentRank < k.previousRank
  ).length

  return {
    totalKeywords,
    totalAudits,
    avgRank,
    improved,
    lastAuditScore: recentAudit?.score ?? null,
    lastAuditDate: recentAudit?.createdAt ?? null,
  }
}

// ─── Audits ──────────────────────────────────────────────────

export async function getSeoAudits() {
  const { db } = await getOrgContext()
  return db.seoAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })
}

export async function runSeoAudit(input: RunAuditInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = runAuditSchema.parse(input)

  // Create audit record with simulated scores (in production, would call an SEO API)
  const score = Math.floor(Math.random() * 30) + 60 // 60-90
  const audit = await db.seoAudit.create({
    data: {
      organizationId,
      url: parsed.url,
      score,
      issues: JSON.parse(JSON.stringify({
        critical: Math.floor(Math.random() * 5),
        warnings: Math.floor(Math.random() * 15) + 5,
        notices: Math.floor(Math.random() * 20) + 10,
        passed: Math.floor(Math.random() * 30) + 40,
      })),
      suggestions: JSON.parse(JSON.stringify({
        performance: Math.floor(Math.random() * 30) + 60,
        accessibility: Math.floor(Math.random() * 20) + 70,
        bestPractices: Math.floor(Math.random() * 20) + 70,
        seo: score,
        metaTitle: true,
        metaDescription: Math.random() > 0.3,
        h1Tag: true,
        imageAlt: Math.random() > 0.4,
        httpsEnabled: true,
        mobileResponsive: Math.random() > 0.2,
        pageSpeed: `${(Math.random() * 3 + 1).toFixed(1)}s`,
      })),
    },
  })

  revalidatePath("/seo/audit")
  revalidatePath("/seo")
  return audit
}

export async function deleteSeoAudit(id: string) {
  const { db } = await getOrgContext()
  await db.seoAudit.delete({ where: { id } })
  revalidatePath("/seo/audit")
}
