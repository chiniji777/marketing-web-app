"use server"

import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import {
  createProductSchema,
  updateProductSchema,
  updateProductMarketingDataSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type UpdateProductMarketingDataInput,
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

  const product = await db.product.create({
    data: {
      organizationId,
      name: parsed.name,
      description: parsed.description,
      category: parsed.category,
      price: parsed.price,
      currency: parsed.currency || "THB",
      images: parsed.images || [],
    },
  })

  revalidatePath("/products")
  return serializePrisma(product)
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
