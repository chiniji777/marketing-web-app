"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { revalidatePath } from "next/cache"

// ─── Types ────────────────────────────────────────────

type AlertOperator = "gt" | "gte" | "lt" | "lte" | "eq"
type AlertMetric = "cpa" | "cpc" | "cpm" | "ctr" | "roas" | "spend" | "impressions" | "clicks" | "conversions" | "frequency"

interface CreateAlertInput {
  name: string
  metric: AlertMetric
  operator: AlertOperator
  threshold: number
  scope?: { campaignIds?: string[]; platform?: string }
  channels: string[]
}

// ─── CRUD ────────────────────────────────────────────

export async function getAdAlerts() {
  const { db } = await getOrgContext()

  const alerts = await db.adAlert.findMany({
    orderBy: { createdAt: "desc" },
  })

  return alerts
}

export async function createAdAlert(input: CreateAlertInput) {
  const { db, organizationId } = await getOrgContext()

  if (!input.name) throw new Error("name is required")
  if (!input.metric) throw new Error("metric is required")
  if (!input.operator) throw new Error("operator is required")
  if (input.threshold == null) throw new Error("threshold is required")
  if (!input.channels?.length) throw new Error("At least one channel is required")

  const alert = await db.adAlert.create({
    data: {
      name: input.name,
      metric: input.metric,
      operator: input.operator,
      threshold: input.threshold,
      scope: input.scope || {},
      channels: input.channels,
      organizationId,
    },
  })

  revalidatePath("/ads")
  return alert
}

export async function deleteAdAlert(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adAlert.findUnique({ where: { id } })
  if (!existing) throw new Error("Alert not found")

  await db.adAlert.delete({ where: { id } })

  revalidatePath("/ads")
  return { success: true }
}

// ─── Alert Checking ────────────────────────────────────

function evaluateCondition(metricValue: number, operator: AlertOperator, threshold: number): boolean {
  switch (operator) {
    case "gt": return metricValue > threshold
    case "gte": return metricValue >= threshold
    case "lt": return metricValue < threshold
    case "lte": return metricValue <= threshold
    case "eq": return metricValue === threshold
    default: return false
  }
}

export async function checkAlerts() {
  const { userId, organizationId, db } = await getOrgContext()

  const activeAlerts = await db.adAlert.findMany({
    where: { isActive: true },
  })

  const triggered: { alertId: string; alertName: string; matchedCampaigns: { id: string; name: string; metricValue: number }[] }[] = []

  for (const alert of activeAlerts) {
    const scope = (alert.scope as { campaignIds?: string[]; platform?: string }) || {}

    const campaignWhere: Record<string, unknown> = {}
    if (scope.campaignIds?.length) {
      campaignWhere.id = { in: scope.campaignIds }
    }
    if (scope.platform) {
      campaignWhere.platform = scope.platform
    }

    const campaigns = await db.adsCampaign.findMany({ where: campaignWhere })
    const matched: { id: string; name: string; metricValue: number }[] = []

    for (const campaign of campaigns) {
      const metrics = (campaign.performanceData as Record<string, unknown>) || {}
      const metricValue = typeof metrics[alert.metric] === "number" ? (metrics[alert.metric] as number) : 0

      if (evaluateCondition(metricValue, alert.operator as AlertOperator, alert.threshold)) {
        matched.push({ id: campaign.id, name: campaign.name, metricValue })
      }
    }

    if (matched.length > 0) {
      // Create in-app notifications
      if (alert.channels.includes("in_app")) {
        await db.notification.create({
          data: {
            userId,
            organizationId,
            title: `Alert: ${alert.name}`,
            message: `${matched.length} campaign(s) triggered alert "${alert.name}" (${alert.metric} ${alert.operator} ${alert.threshold})`,
            type: "AD_ALERT",
            metadata: { alertId: alert.id, matchedCampaigns: matched.map((m) => m.id) },
          },
        })
      }

      // Update lastTriggeredAt
      await db.adAlert.update({
        where: { id: alert.id },
        data: { lastTriggeredAt: new Date() },
      })

      triggered.push({ alertId: alert.id, alertName: alert.name, matchedCampaigns: matched })
    }
  }

  return { totalAlerts: activeAlerts.length, triggered: triggered.length, details: triggered }
}
