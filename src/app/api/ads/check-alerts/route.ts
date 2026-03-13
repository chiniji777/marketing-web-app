import { prisma } from "@/lib/prisma"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const orgsWithAlerts = await prisma.adAlert.findMany({
      where: { isActive: true },
      select: { organizationId: true },
      distinct: ["organizationId"],
    })

    const summary: { organizationId: string; alertsChecked: number; triggered: number }[] = []

    for (const { organizationId } of orgsWithAlerts) {
      const db = getTenantPrisma(organizationId)

      const activeAlerts = await db.adAlert.findMany({
        where: { isActive: true },
      })

      let triggeredCount = 0

      for (const alert of activeAlerts) {
        const scope = (alert.scope as { campaignIds?: string[]; platform?: string }) || {}

        const campaignWhere: Record<string, unknown> = {}
        if (scope.campaignIds?.length) campaignWhere.id = { in: scope.campaignIds }
        if (scope.platform) campaignWhere.platform = scope.platform

        const campaigns = await db.adsCampaign.findMany({ where: campaignWhere })
        const matched: { id: string; name: string; metricValue: number }[] = []

        for (const campaign of campaigns) {
          const metrics = (campaign.performanceData as Record<string, unknown>) || {}
          const metricValue = typeof metrics[alert.metric] === "number" ? (metrics[alert.metric] as number) : 0

          if (evalCond(metricValue, alert.operator, alert.threshold)) {
            matched.push({ id: campaign.id, name: campaign.name, metricValue })
          }
        }

        if (matched.length > 0) {
          triggeredCount++

          if (alert.channels.includes("in_app")) {
            // Find org owner for notification
            const orgMember = await db.membership.findFirst({
              where: { organizationId, role: "ADMIN" },
              select: { userId: true },
            })

            if (orgMember) {
              await db.notification.create({
                data: {
                  userId: orgMember.userId,
                  organizationId,
                  title: `Alert: ${alert.name}`,
                  message: `${matched.length} campaign(s) triggered "${alert.name}" (${alert.metric} ${alert.operator} ${alert.threshold})`,
                  type: "AD_ALERT",
                  metadata: { alertId: alert.id, matchedCampaigns: matched.map((m) => m.id) },
                },
              })
            }
          }

          await db.adAlert.update({
            where: { id: alert.id },
            data: { lastTriggeredAt: new Date() },
          })
        }
      }

      summary.push({ organizationId, alertsChecked: activeAlerts.length, triggered: triggeredCount })
    }

    return Response.json({
      message: "Alerts check complete",
      organizations: summary.length,
      summary,
    })
  } catch (error) {
    console.error("Cron check-alerts error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

function evalCond(metricValue: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case "gt": return metricValue > threshold
    case "gte": return metricValue >= threshold
    case "lt": return metricValue < threshold
    case "lte": return metricValue <= threshold
    case "eq": return metricValue === threshold
    default: return false
  }
}
