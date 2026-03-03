"use server"

import { getOrgContext } from "@/server/lib/org-context"
import {
  createEmailCampaignSchema,
  updateEmailCampaignSchema,
  createEmailTemplateSchema,
  addSubscriberSchema,
  type CreateEmailCampaignInput,
  type UpdateEmailCampaignInput,
  type CreateEmailTemplateInput,
  type AddSubscriberInput,
} from "@/server/validators/email"
import { revalidatePath } from "next/cache"

// ─── Email Campaigns ────────────────────────────────────────

export async function getEmailCampaigns(filters?: {
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
  if (filters?.status) where.status = filters.status
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { subject: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const campaigns = await db.emailCampaign.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: perPage,
    include: { template: { select: { id: true, name: true } } },
  })
  const total = await db.emailCampaign.count({ where })

  return { campaigns, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

export async function getEmailCampaign(id: string) {
  const { db } = await getOrgContext()
  return db.emailCampaign.findFirst({
    where: { id },
    include: { template: true },
  })
}

export async function createEmailCampaign(input: CreateEmailCampaignInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createEmailCampaignSchema.parse(input)

  const campaign = await db.emailCampaign.create({
    data: {
      organizationId,
      name: parsed.name,
      subject: parsed.subject,
      previewText: parsed.previewText,
      htmlContent: parsed.htmlContent,
      textContent: parsed.textContent,
      templateId: parsed.templateId,
      senderName: parsed.senderName,
      senderEmail: parsed.senderEmail,
      replyTo: parsed.replyTo,
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : undefined,
      campaignId: parsed.campaignId,
      automationType: parsed.automationType,
      automationConfig: parsed.automationConfig
        ? JSON.parse(parsed.automationConfig)
        : undefined,
    },
  })

  revalidatePath("/email")
  revalidatePath("/email/automations")
  return campaign
}

export async function updateEmailCampaign(input: UpdateEmailCampaignInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateEmailCampaignSchema.parse(input)

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.subject !== undefined) updateData.subject = data.subject
  if (data.previewText !== undefined) updateData.previewText = data.previewText
  if (data.htmlContent !== undefined) updateData.htmlContent = data.htmlContent
  if (data.textContent !== undefined) updateData.textContent = data.textContent
  if (data.status !== undefined) updateData.status = data.status
  if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null
  if (data.senderName !== undefined) updateData.senderName = data.senderName
  if (data.senderEmail !== undefined) updateData.senderEmail = data.senderEmail

  const campaign = await db.emailCampaign.update({ where: { id }, data: updateData })

  revalidatePath("/email")
  revalidatePath(`/email/${id}`)
  return campaign
}

export async function deleteEmailCampaign(id: string) {
  const { db } = await getOrgContext()
  await db.emailCampaign.delete({ where: { id } })
  revalidatePath("/email")
}

export async function getEmailStats() {
  const { db } = await getOrgContext()

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const totalCampaigns = await db.emailCampaign.count()
  const sent = await db.emailCampaign.count({ where: { status: "SENT" } })
  const scheduled = await db.emailCampaign.count({ where: { status: "SCHEDULED" } })
  const totalSubscribers = await db.emailSubscriber.count()
  const active = await db.emailSubscriber.count({ where: { status: "ACTIVE" } })
  const bounced = await db.emailSubscriber.count({ where: { status: "BOUNCED" } })

  const sentCampaigns = await db.emailCampaign.findMany({
    where: { status: "SENT", totalSent: { gt: 0 } },
    select: { totalSent: true, totalOpened: true, totalClicked: true, totalBounced: true, totalUnsubscribed: true },
  })

  const totalSent = sentCampaigns.reduce((sum, c) => sum + c.totalSent, 0)
  const totalOpened = sentCampaigns.reduce((sum, c) => sum + c.totalOpened, 0)
  const totalClicked = sentCampaigns.reduce((sum, c) => sum + c.totalClicked, 0)

  return {
    totalCampaigns,
    sent,
    scheduled,
    totalSubscribers,
    activeSubscribers: active,
    bouncedSubscribers: bounced,
    avgOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    avgClickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
  }
}

// ─── Email Templates ────────────────────────────────────────

export async function getEmailTemplates() {
  const { db } = await getOrgContext()
  return db.emailTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { emailCampaigns: true } } },
  })
}

export async function createEmailTemplate(input: CreateEmailTemplateInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createEmailTemplateSchema.parse(input)

  const template = await db.emailTemplate.create({
    data: { organizationId, ...parsed },
  })

  revalidatePath("/email/templates")
  return template
}

export async function deleteEmailTemplate(id: string) {
  const { db } = await getOrgContext()
  await db.emailTemplate.delete({ where: { id } })
  revalidatePath("/email/templates")
}

// ─── Subscribers ────────────────────────────────────────────

export async function getSubscribers(filters?: {
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
  if (filters?.status) where.status = filters.status
  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: "insensitive" } },
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const subscribers = await db.emailSubscriber.findMany({
    where,
    orderBy: { subscribedAt: "desc" },
    skip,
    take: perPage,
    include: { tags: true },
  })
  const total = await db.emailSubscriber.count({ where })

  return { subscribers, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

export async function addSubscriber(input: AddSubscriberInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = addSubscriberSchema.parse(input)

  const subscriber = await db.emailSubscriber.upsert({
    where: { organizationId_email: { organizationId, email: parsed.email } },
    update: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      status: "ACTIVE",
      unsubscribedAt: null,
    },
    create: {
      organizationId,
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      contactId: parsed.contactId,
    },
  })

  revalidatePath("/email/subscribers")
  return subscriber
}

export async function unsubscribe(id: string) {
  const { db } = await getOrgContext()
  await db.emailSubscriber.update({
    where: { id },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  })
  revalidatePath("/email/subscribers")
}

export async function deleteSubscriber(id: string) {
  const { db } = await getOrgContext()
  await db.emailSubscriber.delete({ where: { id } })
  revalidatePath("/email/subscribers")
}
