"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    throw new Error("Unauthorized: Super Admin access required")
  }
  return { userId: session.user.id }
}

// ─── Organizations ───────────────────────────────────────────

export async function getAdminOrganizations(filters?: {
  search?: string
  page?: number
  perPage?: number
}) {
  await requireSuperAdmin()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const organizations = await prisma.organization.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
    include: {
      _count: { select: { memberships: true, campaigns: true, leads: true } },
    },
  })
  const total = await prisma.organization.count({ where })

  return { organizations, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

export async function getAdminOrganization(id: string) {
  await requireSuperAdmin()
  return prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      _count: {
        select: { campaigns: true, leads: true, emailCampaigns: true, content: true },
      },
    },
  })
}

// ─── Users ───────────────────────────────────────────────────

export async function getAdminUsers(filters?: {
  search?: string
  page?: number
  perPage?: number
}) {
  await requireSuperAdmin()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isSuperAdmin: true,
      createdAt: true,
      _count: { select: { memberships: true } },
    },
  })
  const total = await prisma.user.count({ where })

  return { users, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

// ─── Platform Analytics ──────────────────────────────────────

export async function getPlatformAnalytics() {
  await requireSuperAdmin()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const totalOrgs = await prisma.organization.count()
  const totalUsers = await prisma.user.count()
  const totalCampaigns = await prisma.campaign.count()
  const totalLeads = await prisma.lead.count()
  const newOrgsThisMonth = await prisma.organization.count({ where: { createdAt: { gte: monthStart } } })
  const newUsersThisMonth = await prisma.user.count({ where: { createdAt: { gte: monthStart } } })
  const newOrgsLastMonth = await prisma.organization.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } })
  const newUsersLastMonth = await prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } })

  return {
    totalOrgs,
    totalUsers,
    totalCampaigns,
    totalLeads,
    newOrgsThisMonth,
    newUsersThisMonth,
    orgGrowth: newOrgsLastMonth > 0 ? Math.round(((newOrgsThisMonth - newOrgsLastMonth) / newOrgsLastMonth) * 100) : 0,
    userGrowth: newUsersLastMonth > 0 ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100) : 0,
  }
}
