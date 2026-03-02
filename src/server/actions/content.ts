"use server"

import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { prisma } from "@/lib/prisma"
import {
  createContentSchema,
  updateContentSchema,
  createTemplateSchema,
  type CreateContentInput,
  type UpdateContentInput,
  type CreateTemplateInput,
} from "@/server/validators/content"
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

// ─── Content CRUD ────────────────────────────────────────────

export async function getContents(filters?: {
  contentType?: string
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
  if (filters?.contentType) {
    where.contentType = filters.contentType
  }
  if (filters?.status) {
    where.status = filters.status
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { body: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const contents = await db.content.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      tags: { select: { id: true, name: true } },
      _count: { select: { posts: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip,
    take: perPage,
  })
  const total = await db.content.count({ where })

  return {
    contents,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  }
}

export async function getContent(id: string) {
  const { db } = await getOrgContext()
  return db.content.findFirst({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      tags: { select: { id: true, name: true } },
      posts: {
        include: {
          socialAccount: { select: { id: true, platform: true, accountName: true } },
        },
      },
    },
  })
}

export async function createContent(input: CreateContentInput) {
  const { userId, organizationId, db } = await getOrgContext()
  const parsed = createContentSchema.parse(input)

  const content = await db.content.create({
    data: {
      title: parsed.title,
      body: parsed.body,
      contentType: parsed.contentType,
      tone: parsed.tone,
      language: parsed.language,
      aiGenerated: parsed.aiGenerated,
      aiPrompt: parsed.aiPrompt,
      createdById: userId,
      organizationId,
      campaignId: parsed.campaignId,
    },
  })

  revalidatePath("/content")
  return content
}

export async function updateContent(input: UpdateContentInput) {
  const { db } = await getOrgContext()
  const parsed = updateContentSchema.parse(input)
  const { id, ...data } = parsed

  const content = await db.content.update({
    where: { id },
    data,
  })

  revalidatePath("/content")
  revalidatePath(`/content/${id}`)
  return content
}

export async function deleteContent(id: string) {
  const { db } = await getOrgContext()
  await db.content.delete({ where: { id } })
  revalidatePath("/content")
}

export async function duplicateContent(id: string) {
  const { userId, organizationId, db } = await getOrgContext()
  const original = await db.content.findFirst({
    where: { id },
  })

  if (!original) throw new Error("Content not found")

  const content = await db.content.create({
    data: {
      title: `${original.title} (Copy)`,
      body: original.body,
      contentType: original.contentType,
      tone: original.tone,
      language: original.language,
      aiGenerated: original.aiGenerated,
      aiPrompt: original.aiPrompt,
      createdById: userId,
      organizationId,
    },
  })

  revalidatePath("/content")
  return content
}

// ─── Templates CRUD ──────────────────────────────────────────

export async function getTemplates(filters?: {
  contentType?: string
  search?: string
}) {
  const { db, organizationId } = await getOrgContext()

  const where: Record<string, unknown> = {}
  if (filters?.contentType) {
    where.contentType = filters.contentType
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Get both org templates and global templates
  return prisma.contentTemplate.findMany({
    where: {
      ...where,
      OR: [{ organizationId }, { isGlobal: true }],
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getTemplate(id: string) {
  const { db } = await getOrgContext()
  return db.contentTemplate.findFirst({ where: { id } })
}

export async function createTemplate(input: CreateTemplateInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createTemplateSchema.parse(input)

  const template = await db.contentTemplate.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      contentType: parsed.contentType,
      body: parsed.body,
      variables: parsed.variables ? JSON.parse(JSON.stringify(parsed.variables)) : undefined,
      organizationId,
    },
  })

  revalidatePath("/content/templates")
  return template
}

export async function deleteTemplate(id: string) {
  const { db } = await getOrgContext()
  await db.contentTemplate.delete({ where: { id } })
  revalidatePath("/content/templates")
}
