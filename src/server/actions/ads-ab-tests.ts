"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { revalidatePath } from "next/cache"

// ─── Types ────────────────────────────────────────────

type TestType = "creative" | "copy" | "audience" | "placement"
type AbTestStatus = "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED"

interface VariantMetrics {
  impressions: number
  clicks: number
  conversions: number
  spend: number
}

interface Variant {
  name: string
  config: Record<string, unknown>
  metrics: VariantMetrics
}

interface AbTestFilters {
  status?: AbTestStatus
  testType?: TestType
  page?: number
  pageSize?: number
}

interface CreateAbTestInput {
  name: string
  description?: string
  testType: TestType
  variants: Variant[]
}

interface UpdateAbTestInput {
  name?: string
  description?: string
  testType?: TestType
  variants?: Variant[]
}

// ─── Helpers ────────────────────────────────────────────

const REVALIDATE_PATH = "/ads/ab-tests"

function assertStatus(current: string, allowed: string[], action: string) {
  if (!allowed.includes(current)) {
    throw new Error(`Cannot ${action} test with status ${current}`)
  }
}

// ─── CRUD ────────────────────────────────────────────

export async function getAbTests(filters?: AbTestFilters) {
  const { db } = await getOrgContext()

  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.testType) where.testType = filters.testType

  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const [tests, total] = await Promise.all([
    db.adAbTest.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.adAbTest.count({ where }),
  ])

  return { tests, total, page, pageSize }
}

export async function getAbTest(id: string) {
  const { db } = await getOrgContext()

  const test = await db.adAbTest.findUnique({ where: { id } })
  if (!test) throw new Error("A/B Test not found")

  return test
}

export async function createAbTest(input: CreateAbTestInput) {
  const { db, organizationId } = await getOrgContext()

  if (!input.name) throw new Error("name is required")
  if (!input.variants?.length || input.variants.length < 2) {
    throw new Error("At least 2 variants are required")
  }

  const test = await db.adAbTest.create({
    data: {
      name: input.name,
      description: input.description || null,
      testType: input.testType,
      variants: JSON.parse(JSON.stringify(input.variants)),
      status: "DRAFT",
      organizationId,
    },
  })

  revalidatePath(REVALIDATE_PATH)
  return test
}

export async function updateAbTest(id: string, input: UpdateAbTestInput) {
  const { db } = await getOrgContext()

  const existing = await db.adAbTest.findUnique({ where: { id } })
  if (!existing) throw new Error("A/B Test not found")
  assertStatus(existing.status, ["DRAFT"], "edit")

  const data: Record<string, unknown> = {}
  if (input.name !== undefined) data.name = input.name
  if (input.description !== undefined) data.description = input.description
  if (input.testType !== undefined) data.testType = input.testType
  if (input.variants !== undefined) data.variants = JSON.parse(JSON.stringify(input.variants))

  const test = await db.adAbTest.update({ where: { id }, data })

  revalidatePath(REVALIDATE_PATH)
  return test
}

export async function deleteAbTest(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adAbTest.findUnique({ where: { id } })
  if (!existing) throw new Error("A/B Test not found")
  assertStatus(existing.status, ["DRAFT", "CANCELLED"], "delete")

  await db.adAbTest.delete({ where: { id } })

  revalidatePath(REVALIDATE_PATH)
  return { success: true }
}

// ─── Status Transitions ────────────────────────────────

export async function startAbTest(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adAbTest.findUnique({ where: { id } })
  if (!existing) throw new Error("A/B Test not found")
  assertStatus(existing.status, ["DRAFT"], "start")

  const test = await db.adAbTest.update({
    where: { id },
    data: { status: "RUNNING", startedAt: new Date() },
  })

  revalidatePath(REVALIDATE_PATH)
  return test
}

export async function pauseAbTest(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adAbTest.findUnique({ where: { id } })
  if (!existing) throw new Error("A/B Test not found")
  assertStatus(existing.status, ["RUNNING"], "pause")

  const test = await db.adAbTest.update({
    where: { id },
    data: { status: "PAUSED" },
  })

  revalidatePath(REVALIDATE_PATH)
  return test
}

export async function resumeAbTest(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adAbTest.findUnique({ where: { id } })
  if (!existing) throw new Error("A/B Test not found")
  assertStatus(existing.status, ["PAUSED"], "resume")

  const test = await db.adAbTest.update({
    where: { id },
    data: { status: "RUNNING" },
  })

  revalidatePath(REVALIDATE_PATH)
  return test
}

export async function completeAbTest(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adAbTest.findUnique({ where: { id } })
  if (!existing) throw new Error("A/B Test not found")
  assertStatus(existing.status, ["RUNNING"], "complete")

  const test = await db.adAbTest.update({
    where: { id },
    data: { status: "COMPLETED", endedAt: new Date() },
  })

  revalidatePath(REVALIDATE_PATH)
  return test
}

export async function cancelAbTest(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adAbTest.findUnique({ where: { id } })
  if (!existing) throw new Error("A/B Test not found")
  assertStatus(existing.status, ["DRAFT", "RUNNING", "PAUSED"], "cancel")

  const test = await db.adAbTest.update({
    where: { id },
    data: { status: "CANCELLED", endedAt: new Date() },
  })

  revalidatePath(REVALIDATE_PATH)
  return test
}

// ─── Statistical Significance ────────────────────────────

export async function calculateSignificance(testId: string) {
  const { db } = await getOrgContext()

  const test = await db.adAbTest.findUnique({ where: { id: testId } })
  if (!test) throw new Error("A/B Test not found")

  const variants = test.variants as unknown as Variant[]
  if (!variants || variants.length < 2) {
    throw new Error("Need at least 2 variants to calculate significance")
  }

  // Use first two variants for z-test
  const v1 = variants[0]
  const v2 = variants[1]

  const n1 = v1.metrics.clicks || 0
  const n2 = v2.metrics.clicks || 0
  const x1 = v1.metrics.conversions || 0
  const x2 = v2.metrics.conversions || 0

  if (n1 === 0 || n2 === 0) {
    return { isSignificant: false, confidenceLevel: 0, winnerVariant: null }
  }

  // Conversion rates
  const p1 = x1 / n1
  const p2 = x2 / n2

  // Pooled proportion
  const p = (x1 + x2) / (n1 + n2)

  const denominator = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
  if (denominator === 0) {
    return { isSignificant: false, confidenceLevel: 0, winnerVariant: null }
  }

  const z = Math.abs(p1 - p2) / denominator

  // z-score to confidence level (two-tailed approximation)
  let confidenceLevel: number
  if (z >= 2.576) confidenceLevel = 99
  else if (z >= 1.96) confidenceLevel = 95
  else if (z >= 1.645) confidenceLevel = 90
  else if (z >= 1.28) confidenceLevel = 80
  else confidenceLevel = Math.round(z / 1.28 * 80)

  const isSignificant = confidenceLevel >= 95
  const winnerVariant = isSignificant ? (p1 > p2 ? v1.name : v2.name) : null

  return { isSignificant, confidenceLevel, winnerVariant }
}

export async function declareWinner(testId: string, variantName: string) {
  const { db } = await getOrgContext()

  const test = await db.adAbTest.findUnique({ where: { id: testId } })
  if (!test) throw new Error("A/B Test not found")

  const variants = test.variants as unknown as Variant[]
  const variant = variants.find((v) => v.name === variantName)
  if (!variant) throw new Error(`Variant "${variantName}" not found`)

  const significance = await calculateSignificance(testId)

  const updated = await db.adAbTest.update({
    where: { id: testId },
    data: {
      winnerVariant: variantName,
      confidenceLevel: significance.confidenceLevel,
      status: "COMPLETED",
      endedAt: test.endedAt || new Date(),
    },
  })

  revalidatePath(REVALIDATE_PATH)
  return updated
}
