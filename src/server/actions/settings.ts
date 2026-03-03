"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrgContext } from "@/server/lib/org-context"
import { revalidatePath } from "next/cache"

// ─── Organization Settings ───────────────────────────────────

export async function getOrganizationSettings() {
  const { organizationId } = await getOrgContext()
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
    },
  })
}

export async function updateOrganizationSettings(data: {
  name?: string
  slug?: string
  logo?: string
}) {
  const { organizationId } = await getOrgContext()

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.logo !== undefined) updateData.logo = data.logo

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: updateData,
  })

  revalidatePath("/settings/organization")
  return org
}

// ─── Team Members ────────────────────────────────────────────

export async function getTeamMembers() {
  const { organizationId } = await getOrgContext()

  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  })
}

export async function inviteTeamMember(email: string, role: string) {
  const { organizationId } = await getOrgContext()

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error("User not found. They must create an account first.")
  }

  // Check if already a member
  const existing = await prisma.membership.findFirst({
    where: { organizationId, userId: user.id },
  })
  if (existing) {
    throw new Error("User is already a member of this organization")
  }

  const membership = await prisma.membership.create({
    data: {
      organizationId,
      userId: user.id,
      role: role.toUpperCase() as "ADMIN" | "MANAGER" | "MEMBER",
    },
  })

  revalidatePath("/settings/team")
  return membership
}

export async function updateMemberRole(membershipId: string, role: string) {
  const { organizationId } = await getOrgContext()

  const membership = await prisma.membership.update({
    where: { id: membershipId, organizationId },
    data: { role: role.toUpperCase() as "ADMIN" | "MANAGER" | "MEMBER" },
  })

  revalidatePath("/settings/team")
  return membership
}

export async function removeMember(membershipId: string) {
  const { organizationId } = await getOrgContext()

  await prisma.membership.delete({
    where: { id: membershipId, organizationId },
  })

  revalidatePath("/settings/team")
}

// ─── User Profile ────────────────────────────────────────────

export async function getUserProfile() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
  })
}

export async function updateUserProfile(data: { name?: string; image?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.image !== undefined) updateData.image = data.image

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  })

  revalidatePath("/settings")
  return user
}
