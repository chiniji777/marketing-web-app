"use server"

import { getOrgContext } from "@/server/lib/org-context"
import {
  createContactSchema,
  updateContactSchema,
  createLeadSchema,
  updateLeadSchema,
  createLeadFormSchema,
  type CreateContactInput,
  type UpdateContactInput,
  type CreateLeadInput,
  type UpdateLeadInput,
  type CreateLeadFormInput,
} from "@/server/validators/lead"
import { revalidatePath } from "next/cache"
import { serializePrisma } from "@/lib/serialize"

// ─── Contacts ───────────────────────────────────────────────

export async function getContacts(filters?: {
  search?: string
  page?: number
  perPage?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const contacts = await db.contact.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: perPage, include: { _count: { select: { leads: true } } } })
  const total = await db.contact.count({ where })

  return { contacts, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

export async function getContact(id: string) {
  const { db } = await getOrgContext()
  return db.contact.findFirst({
    where: { id },
    include: { leads: { include: { activities: { orderBy: { createdAt: "desc" }, take: 10 } } } },
  })
}

export async function createContact(input: CreateContactInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createContactSchema.parse(input)
  const contact = await db.contact.create({
    data: {
      organizationId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      company: parsed.company,
      jobTitle: parsed.jobTitle,
      socialProfiles: parsed.socialProfiles ? JSON.parse(JSON.stringify(parsed.socialProfiles)) : undefined,
      customFields: parsed.customFields ? JSON.parse(JSON.stringify(parsed.customFields)) : undefined,
    },
  })
  revalidatePath("/leads")
  return contact
}

export async function updateContact(input: UpdateContactInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateContactSchema.parse(input)
  const contact = await db.contact.update({ where: { id }, data })
  revalidatePath("/leads")
  return contact
}

export async function deleteContact(id: string) {
  const { db } = await getOrgContext()
  await db.contact.delete({ where: { id } })
  revalidatePath("/leads")
}

// ─── Leads ──────────────────────────────────────────────────

export async function getLeads(filters?: {
  status?: string
  pipelineStage?: string
  search?: string
  page?: number
  perPage?: number
}) {
  const { db } = await getOrgContext()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 50
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.pipelineStage) where.pipelineStage = filters.pipelineStage
  if (filters?.search) {
    where.OR = [
      { contact: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { contact: { email: { contains: filters.search, mode: "insensitive" } } },
      { contact: { company: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const leads = await db.lead.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: perPage,
    include: {
      contact: true,
      assignedTo: { select: { id: true, name: true, image: true } },
      _count: { select: { activities: true } },
    },
  })
  const total = await db.lead.count({ where })

  return { leads: serializePrisma(leads), pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } }
}

export async function getLeadsByPipeline() {
  const { db } = await getOrgContext()

  const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const results = []
  for (const stage of stages) {
    const leads = await db.lead.findMany({
      where: { pipelineStage: stage },
      orderBy: { updatedAt: "desc" },
      include: {
        contact: true,
        assignedTo: { select: { id: true, name: true, image: true } },
      },
    })
    results.push({ stage, leads: serializePrisma(leads) })
  }

  return results
}

export async function getLead(id: string) {
  const { db } = await getOrgContext()
  const lead = await db.lead.findFirst({
    where: { id },
    include: {
      contact: true,
      assignedTo: { select: { id: true, name: true, image: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      tags: true,
    },
  })
  return lead ? serializePrisma(lead) : null
}

export async function createLead(input: CreateLeadInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createLeadSchema.parse(input)

  let contactId = parsed.contactId

  if (!contactId && parsed.email) {
    const existing = await db.contact.findFirst({ where: { email: parsed.email } })
    if (existing) {
      contactId = existing.id
    } else {
      const newContact = await db.contact.create({
        data: {
          organizationId,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          phone: parsed.phone,
          company: parsed.company,
        },
      })
      contactId = newContact.id
    }
  } else if (!contactId) {
    const newContact = await db.contact.create({
      data: {
        organizationId,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone,
        company: parsed.company,
      },
    })
    contactId = newContact.id
  }

  const lead = await db.lead.create({
    data: {
      organizationId,
      contactId,
      source: parsed.source,
      sourceDetail: parsed.sourceDetail,
      estimatedValue: parsed.estimatedValue,
      pipelineStage: parsed.pipelineStage,
    },
  })

  await db.leadActivity.create({
    data: { leadId: lead.id, type: "CREATED", description: "Lead created" },
  })

  revalidatePath("/leads")
  return serializePrisma(lead)
}

export async function updateLead(input: UpdateLeadInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateLeadSchema.parse(input)

  const updateData: Record<string, unknown> = {}
  if (data.status !== undefined) updateData.status = data.status
  if (data.pipelineStage !== undefined) updateData.pipelineStage = data.pipelineStage
  if (data.score !== undefined) updateData.score = data.score
  if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId
  if (data.estimatedValue !== undefined) updateData.estimatedValue = data.estimatedValue
  if (data.source !== undefined) updateData.source = data.source
  updateData.lastActivityAt = new Date()

  const lead = await db.lead.update({ where: { id }, data: updateData })

  if (data.pipelineStage) {
    await db.leadActivity.create({
      data: { leadId: id, type: "STAGE_CHANGE", description: `Moved to ${data.pipelineStage}` },
    })
  }
  if (data.status) {
    await db.leadActivity.create({
      data: { leadId: id, type: "STATUS_CHANGE", description: `Status changed to ${data.status}` },
    })
  }

  revalidatePath("/leads")
  return serializePrisma(lead)
}

export async function deleteLead(id: string) {
  const { db } = await getOrgContext()
  await db.lead.delete({ where: { id } })
  revalidatePath("/leads")
}

export async function addLeadActivity(leadId: string, type: string, description: string) {
  const { db } = await getOrgContext()
  const activity = await db.leadActivity.create({
    data: { leadId, type, description },
  })
  await db.lead.update({ where: { id: leadId }, data: { lastActivityAt: new Date() } })
  revalidatePath("/leads")
  return activity
}

export async function getLeadStats() {
  const { db } = await getOrgContext()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const total = await db.lead.count()
  const newLeads = await db.lead.count({ where: { createdAt: { gte: monthStart } } })
  const qualified = await db.lead.count({ where: { status: "QUALIFIED" } })
  const won = await db.lead.count({ where: { status: "WON" } })
  const lost = await db.lead.count({ where: { status: "LOST" } })
  const totalValue = await db.lead.aggregate({ where: { status: { not: "LOST" } }, _sum: { estimatedValue: true } })

  return {
    total,
    newLeads,
    qualified,
    won,
    lost,
    pipelineValue: Number(totalValue._sum.estimatedValue ?? 0),
    conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
  }
}

// ─── Lead Forms ─────────────────────────────────────────────

export async function getLeadForms() {
  const { db } = await getOrgContext()
  return db.leadForm.findMany({ orderBy: { createdAt: "desc" } })
}

export async function createLeadForm(input: CreateLeadFormInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createLeadFormSchema.parse(input)

  const form = await db.leadForm.create({
    data: {
      organizationId,
      name: parsed.name,
      description: parsed.description,
      fields: JSON.parse(JSON.stringify(parsed.fields)),
      thankYouMessage: parsed.thankYouMessage,
      redirectUrl: parsed.redirectUrl,
    },
  })

  revalidatePath("/leads/forms")
  return form
}

export async function deleteLeadForm(id: string) {
  const { db } = await getOrgContext()
  await db.leadForm.delete({ where: { id } })
  revalidatePath("/leads/forms")
}
