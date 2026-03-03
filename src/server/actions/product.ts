"use server"

import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import {
  createProductSchema,
  updateProductSchema,
  updateProductMarketingDataSchema,
  createProductContentSchema,
  createProductEmailCampaignSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type UpdateProductMarketingDataInput,
  type CreateProductContentInput,
  type CreateProductEmailCampaignInput,
} from "@/server/validators/product"
import { revalidatePath } from "next/cache"
import { serializePrisma } from "@/lib/serialize"
import type { Prisma } from "@/generated/prisma/client"

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

// ─── List Products ──────────────────────────────────────────

export async function getProducts(filters?: {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { category: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.product.count({ where }),
  ])

  return {
    products: serializePrisma(products),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── Get Single Product ─────────────────────────────────────

export async function getProduct(id: string) {
  const { db } = await getOrgContext()

  const product = await db.product.findFirst({
    where: { id },
    include: {
      adsCampaigns: {
        select: { id: true, name: true, status: true, platform: true },
        take: 10,
      },
    },
  })

  if (!product) throw new Error("Product not found")
  return serializePrisma(product)
}

// ─── Create Product ─────────────────────────────────────────

export async function createProduct(input: CreateProductInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createProductSchema.parse(input)

  try {
    const product = await db.product.create({
      data: {
        organizationId,
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        price: parsed.price ?? undefined,
        currency: parsed.currency || "THB",
        images: parsed.images || [],
      },
    })

    revalidatePath("/products")
    return serializePrisma(product)
  } catch (err) {
    console.error("createProduct error:", err)
    throw new Error(
      `ไม่สามารถสร้างสินค้าได้: ${err instanceof Error ? err.message : "Unknown error"}`
    )
  }
}

// ─── Update Product ─────────────────────────────────────────

export async function updateProduct(input: UpdateProductInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateProductSchema.parse(input)

  const product = await db.product.update({
    where: { id },
    data,
  })

  revalidatePath("/products")
  revalidatePath(`/products/${id}`)
  return serializePrisma(product)
}

// ─── Update Marketing Data ──────────────────────────────────

export async function updateProductMarketingData(input: UpdateProductMarketingDataInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateProductMarketingDataSchema.parse(input)

  const product = await db.product.update({
    where: { id },
    data: data as Prisma.ProductUncheckedUpdateInput,
  })

  revalidatePath(`/products/${id}`)
  return serializePrisma(product)
}

// ─── Delete Product ─────────────────────────────────────────

export async function deleteProduct(id: string) {
  const { db } = await getOrgContext()

  await db.product.delete({ where: { id } })

  revalidatePath("/products")
  return { success: true }
}

// ─── Get Product Stats ──────────────────────────────────────

export async function getProductStats() {
  const { db } = await getOrgContext()

  const [total, active, draft, withAds] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.product.count({ where: { status: "DRAFT" } }),
    db.product.count({ where: { adsCampaigns: { some: {} } } }),
  ])

  return { total, active, draft, withAds }
}

// ─── Product-Scoped Content ─────────────────────────────────

export async function getProductContents(productId: string, filters?: {
  status?: string
  page?: number
  pageSize?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = { productId }
  if (filters?.status) where.status = filters.status

  const [contents, total] = await Promise.all([
    db.content.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.content.count({ where }),
  ])

  return {
    contents: serializePrisma(contents),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function createProductContent(input: CreateProductContentInput) {
  const { userId, organizationId, db } = await getOrgContext()
  const parsed = createProductContentSchema.parse(input)

  const content = await db.content.create({
    data: {
      title: parsed.title,
      body: parsed.body,
      contentType: parsed.contentType,
      tone: parsed.tone,
      language: parsed.language,
      aiGenerated: parsed.aiGenerated,
      aiPrompt: parsed.aiPrompt,
      productId: parsed.productId,
      createdById: userId,
      organizationId,
    },
  })

  revalidatePath(`/products/${parsed.productId}`)
  revalidatePath("/content")
  return serializePrisma(content)
}

// ─── Product-Scoped Social Mentions ─────────────────────────

export async function getProductMentions(productId: string, filters?: {
  page?: number
  pageSize?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const skip = (page - 1) * pageSize

  const where = { productId }

  const [mentions, total] = await Promise.all([
    db.socialMention.findMany({
      where,
      orderBy: { mentionedAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.socialMention.count({ where }),
  ])

  return {
    mentions: serializePrisma(mentions),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── Product-Scoped Email Campaigns ─────────────────────────

export async function getProductEmailCampaigns(productId: string, filters?: {
  page?: number
  pageSize?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const skip = (page - 1) * pageSize

  const where = { productId }

  const [campaigns, total] = await Promise.all([
    db.emailCampaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.emailCampaign.count({ where }),
  ])

  return {
    campaigns: serializePrisma(campaigns),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function createProductEmailCampaign(input: CreateProductEmailCampaignInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createProductEmailCampaignSchema.parse(input)

  const campaign = await db.emailCampaign.create({
    data: {
      name: parsed.name,
      subject: parsed.subject,
      htmlContent: parsed.htmlContent,
      textContent: parsed.textContent,
      senderName: parsed.senderName,
      senderEmail: parsed.senderEmail,
      productId: parsed.productId,
      organizationId,
    },
  })

  revalidatePath(`/products/${parsed.productId}`)
  revalidatePath("/email")
  return serializePrisma(campaign)
}

// ─── Product-Scoped Ad Campaigns ────────────────────────────

export async function getProductCampaigns(productId: string, filters?: {
  page?: number
  pageSize?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const skip = (page - 1) * pageSize

  const where = { productId }

  const [campaigns, total] = await Promise.all([
    db.campaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.campaign.count({ where }),
  ])

  return {
    campaigns: serializePrisma(campaigns),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── Update Content Schedule (for calendar DnD) ─────────────

export async function updateContentSchedule(contentId: string, scheduledAt: string) {
  const { db } = await getOrgContext()

  const content = await db.content.update({
    where: { id: contentId },
    data: {
      scheduledAt: new Date(scheduledAt),
      status: "SCHEDULED",
    },
  })

  revalidatePath("/content")
  revalidatePath("/content/calendar")
  return serializePrisma(content)
}

// ─── Get Products List (simple, for selectors) ──────────────

export async function getProductsSimple() {
  const { db } = await getOrgContext()

  const products = await db.product.findMany({
    select: { id: true, name: true, category: true, marketingDataScore: true },
    orderBy: { name: "asc" },
  })

  return serializePrisma(products)
}
