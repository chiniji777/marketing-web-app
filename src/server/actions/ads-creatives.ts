"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { serializePrisma } from "@/lib/serialize"
import { revalidatePath } from "next/cache"

// ─── Types ──────────────────────────────────────────────────

type CreativeType = "IMAGE" | "VIDEO" | "CAROUSEL" | "COLLECTION" | "STORY" | "REEL"

interface CreativeFilters {
  type?: CreativeType
  search?: string
  tags?: string[]
  page?: number
  perPage?: number
}

interface CreateCreativeInput {
  name: string
  type: CreativeType
  fileUrl: string
  thumbnailUrl?: string
  dimensions?: { width: number; height: number }
  fileSize?: number
  mimeType?: string
  tags?: string[]
}

interface UpdateCreativeInput {
  name?: string
  type?: CreativeType
  fileUrl?: string
  thumbnailUrl?: string
  dimensions?: { width: number; height: number }
  fileSize?: number
  mimeType?: string
  tags?: string[]
}

// ─── Get Creatives (list with filters + pagination) ─────────

export async function getCreatives(filters?: CreativeFilters) {
  const { db } = await getOrgContext()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.type) where.type = filters.type
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { tags: { hasSome: [filters.search] } },
    ]
  }
  if (filters?.tags?.length) {
    where.tags = { hasSome: filters.tags }
  }

  const creatives = await db.adCreative.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: perPage,
  })
  const total = await db.adCreative.count({ where })

  return {
    creatives: serializePrisma(creatives),
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  }
}

// ─── Get Creative by ID ─────────────────────────────────────

export async function getCreativeById(id: string) {
  const { db } = await getOrgContext()
  const creative = await db.adCreative.findFirst({ where: { id } })
  if (!creative) throw new Error("Creative not found")
  return serializePrisma(creative)
}

// ─── Create Creative ────────────────────────────────────────

export async function createCreative(data: CreateCreativeInput) {
  const { db, organizationId } = await getOrgContext()

  const creative = await db.adCreative.create({
    data: {
      organizationId,
      name: data.name,
      type: data.type,
      fileUrl: data.fileUrl,
      thumbnailUrl: data.thumbnailUrl,
      dimensions: data.dimensions ?? undefined,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      tags: data.tags ?? [],
    },
  })

  revalidatePath("/ads/creatives")
  return serializePrisma(creative)
}

// ─── Update Creative ────────────────────────────────────────

export async function updateCreative(id: string, data: UpdateCreativeInput) {
  const { db } = await getOrgContext()

  const creative = await db.adCreative.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
      ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
      ...(data.dimensions !== undefined && { dimensions: data.dimensions }),
      ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
      ...(data.mimeType !== undefined && { mimeType: data.mimeType }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  })

  revalidatePath("/ads/creatives")
  return serializePrisma(creative)
}

// ─── Delete Creative ────────────────────────────────────────

export async function deleteCreative(id: string) {
  const { db } = await getOrgContext()
  await db.adCreative.delete({ where: { id } })
  revalidatePath("/ads/creatives")
  return { success: true }
}

// ─── Get Creative Performance ───────────────────────────────

export async function getCreativePerformance(id: string) {
  const { db } = await getOrgContext()
  const creative = await db.adCreative.findFirst({
    where: { id },
    select: { performance: true, name: true },
  })
  if (!creative) throw new Error("Creative not found")

  const perf = (creative.performance as Record<string, number>) ?? {}
  return {
    name: creative.name,
    impressions: perf.impressions ?? 0,
    clicks: perf.clicks ?? 0,
    ctr: perf.ctr ?? (perf.impressions ? ((perf.clicks ?? 0) / perf.impressions) * 100 : 0),
    cpc: perf.cpc ?? 0,
    spend: perf.spend ?? 0,
    conversions: perf.conversions ?? 0,
  }
}
