"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { serializePrisma } from "@/lib/serialize"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ─── Validators ─────────────────────────────────────────────

const targetingSchema = z.object({
  age_min: z.number().min(18).max(65).optional(),
  age_max: z.number().min(18).max(65).optional(),
  genders: z.array(z.number()).optional(),
  interests: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  behaviors: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  locations: z.array(z.object({ key: z.string(), name: z.string() })).optional(),
  languages: z.array(z.string()).optional(),
})

const createAudienceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  targeting: targetingSchema,
  type: z.enum(["SAVED", "CUSTOM", "LOOKALIKE"]).default("SAVED"),
})

const updateAudienceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  targeting: targetingSchema.optional(),
  type: z.enum(["SAVED", "CUSTOM", "LOOKALIKE"]).optional(),
})

export type CreateAudienceInput = z.infer<typeof createAudienceSchema>
export type UpdateAudienceInput = z.infer<typeof updateAudienceSchema>

// ─── Get Audiences (list) ───────────────────────────────────

export async function getAudiences(filters?: {
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
  if (filters?.type) where.type = filters.type
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" }
  }

  const audiences = await db.savedAudience.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: perPage,
  })
  const total = await db.savedAudience.count({ where })

  return {
    audiences: serializePrisma(audiences),
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  }
}

// ─── Get Audience by ID ─────────────────────────────────────

export async function getAudienceById(id: string) {
  const { db } = await getOrgContext()
  const audience = await db.savedAudience.findFirst({ where: { id } })
  return audience ? serializePrisma(audience) : null
}

// ─── Create Audience ────────────────────────────────────────

export async function createAudience(input: CreateAudienceInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createAudienceSchema.parse(input)

  const estimated = estimateFromTargeting(parsed.targeting)

  const audience = await db.savedAudience.create({
    data: {
      organizationId,
      name: parsed.name,
      description: parsed.description ?? null,
      targeting: JSON.parse(JSON.stringify(parsed.targeting)),
      estimatedSize: estimated,
      type: parsed.type,
    },
  })

  revalidatePath("/ads/audiences")
  return serializePrisma(audience)
}

// ─── Update Audience ────────────────────────────────────────

export async function updateAudience(input: UpdateAudienceInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateAudienceSchema.parse(input)

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.type !== undefined) updateData.type = data.type
  if (data.targeting !== undefined) {
    updateData.targeting = data.targeting as Record<string, unknown>
    updateData.estimatedSize = estimateFromTargeting(data.targeting)
  }

  const audience = await db.savedAudience.update({ where: { id }, data: updateData })

  revalidatePath("/ads/audiences")
  return serializePrisma(audience)
}

// ─── Delete Audience ────────────────────────────────────────

export async function deleteAudience(id: string) {
  const { db } = await getOrgContext()
  await db.savedAudience.delete({ where: { id } })
  revalidatePath("/ads/audiences")
}

// ─── Estimate Audience Size (mock) ──────────────────────────

export async function estimateAudienceSize(targeting: z.infer<typeof targetingSchema>) {
  const parsed = targetingSchema.parse(targeting)
  return { estimatedSize: estimateFromTargeting(parsed) }
}

// ─── Helper: mock estimation ────────────────────────────────

function estimateFromTargeting(targeting: z.infer<typeof targetingSchema>): number {
  let base = 5_000_000

  // Age range narrows audience
  const ageMin = targeting.age_min ?? 18
  const ageMax = targeting.age_max ?? 65
  const ageRange = ageMax - ageMin
  base = Math.round(base * (ageRange / 47))

  // Gender filter
  if (targeting.genders && targeting.genders.length === 1) {
    base = Math.round(base * 0.52)
  }

  // Location multiplier
  if (targeting.locations && targeting.locations.length > 0) {
    base = Math.round(base * (0.3 * targeting.locations.length))
  }

  // Interests narrow audience
  if (targeting.interests && targeting.interests.length > 0) {
    base = Math.round(base * Math.max(0.1, 1 - targeting.interests.length * 0.15))
  }

  // Behaviors narrow audience
  if (targeting.behaviors && targeting.behaviors.length > 0) {
    base = Math.round(base * Math.max(0.1, 1 - targeting.behaviors.length * 0.2))
  }

  return Math.max(1000, Math.min(base, 10_000_000))
}
