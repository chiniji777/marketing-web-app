"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { getTenantPrisma } from "@/lib/prisma-extension"
import {
  createReportSchema,
  updateReportSchema,
  type CreateReportInput,
  type UpdateReportInput,
} from "@/server/validators/report"
import { revalidatePath } from "next/cache"

export async function getReports() {
  const { db } = await getOrgContext()
  return db.report.findMany({
    orderBy: { updatedAt: "desc" },
  })
}

export async function getReport(id: string) {
  const { db } = await getOrgContext()
  return db.report.findFirst({
    where: { id },
  })
}

export async function createReport(input: CreateReportInput) {
  const { organizationId, db } = await getOrgContext()
  const parsed = createReportSchema.parse(input)

  // Build report data based on type
  const reportData = await generateReportData(db, parsed.type, parsed.dateRange ?? "30d", parsed.startDate, parsed.endDate)

  const report = await db.report.create({
    data: {
      organizationId,
      name: parsed.name,
      description: parsed.description,
      type: parsed.type,
      config: {
        dateRange: parsed.dateRange,
        metrics: parsed.metrics,
        filters: parsed.filters,
        data: reportData,
      },
      lastGeneratedAt: new Date(),
    },
  })

  revalidatePath("/reports")
  return report
}

export async function updateReport(input: UpdateReportInput) {
  const { db } = await getOrgContext()
  const { id, ...data } = updateReportSchema.parse(input)

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description

  const report = await db.report.update({ where: { id }, data: updateData })
  revalidatePath("/reports")
  return report
}

export async function deleteReport(id: string) {
  const { db } = await getOrgContext()
  await db.report.delete({ where: { id } })
  revalidatePath("/reports")
}

async function generateReportData(
  db: ReturnType<typeof getTenantPrisma>,
  type: string,
  dateRange: string,
  startDate?: string,
  endDate?: string,
) {
  const now = new Date()
  const from = new Date()

  switch (dateRange) {
    case "7d": from.setDate(now.getDate() - 7); break
    case "30d": from.setDate(now.getDate() - 30); break
    case "90d": from.setDate(now.getDate() - 90); break
    case "12m": from.setFullYear(now.getFullYear() - 1); break
    case "custom":
      if (startDate) {
        from.setTime(new Date(startDate).getTime())
      }
      break
  }

  switch (type) {
    case "CAMPAIGN": {
      const campaigns = await db.campaign.findMany({
        where: { createdAt: { gte: from } },
        select: { name: true, status: true, type: true, budget: true },
      })
      return {
        totalCampaigns: campaigns.length,
        byStatus: {
          active: campaigns.filter((c) => c.status === "ACTIVE").length,
          completed: campaigns.filter((c) => c.status === "COMPLETED").length,
        },
        campaigns: campaigns.map((c) => ({ name: c.name, status: c.status, type: c.type, budget: Number(c.budget ?? 0) })),
      }
    }
    case "LEADS": {
      // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
      const total = await db.lead.count({ where: { createdAt: { gte: from } } })
      const newLeads = await db.lead.count({ where: { createdAt: { gte: from }, pipelineStage: "new" } })
      const won = await db.lead.count({ where: { createdAt: { gte: from }, status: "WON" } })
      const lost = await db.lead.count({ where: { createdAt: { gte: from }, status: "LOST" } })
      return { total, newLeads, won, lost, conversionRate: total > 0 ? Math.round((won / total) * 100) : 0 }
    }
    case "EMAIL": {
      const campaigns = await db.emailCampaign.findMany({
        where: { createdAt: { gte: from } },
        select: { name: true, status: true, totalSent: true, totalOpened: true, totalClicked: true, totalBounced: true },
      })
      const totalSent = campaigns.reduce((s, c) => s + c.totalSent, 0)
      const totalOpened = campaigns.reduce((s, c) => s + c.totalOpened, 0)
      return {
        totalCampaigns: campaigns.length,
        totalSent,
        avgOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      }
    }
    default:
      return { generated: true, type, dateRange, generatedAt: now.toISOString() }
  }
}
