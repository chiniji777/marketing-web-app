import { prisma } from "@/lib/prisma"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    // Get all organizations that have active rules
    const orgsWithRules = await prisma.adRule.findMany({
      where: { isActive: true },
      select: { organizationId: true },
      distinct: ["organizationId"],
    })

    const summary: { organizationId: string; rulesProcessed: number; totalMatched: number }[] = []

    for (const { organizationId } of orgsWithRules) {
      const db = getTenantPrisma(organizationId)

      const activeRules = await db.adRule.findMany({
        where: { isActive: true },
      })

      let totalMatched = 0

      for (const rule of activeRules) {
        const conditions = rule.conditions as { conditions: { metric: string; operator: string; value: number }[]; logic: "AND" | "OR" }
        const actions = rule.actions as { actions: { type: string; params?: Record<string, unknown> }[] }
        const scope = rule.scope as { campaignIds?: string[]; platform?: string }

        const campaignWhere: Record<string, unknown> = {}
        if (scope.campaignIds?.length) campaignWhere.id = { in: scope.campaignIds }
        if (scope.platform) campaignWhere.platform = scope.platform

        const campaigns = await db.adsCampaign.findMany({ where: campaignWhere })

        for (const campaign of campaigns) {
          const metrics = (campaign.performanceData as Record<string, unknown>) || {}

          const matches = conditions.logic === "AND"
            ? conditions.conditions.every((c) => evalCond(getMetric(metrics, c.metric), c.operator, c.value))
            : conditions.conditions.some((c) => evalCond(getMetric(metrics, c.metric), c.operator, c.value))

          if (matches) {
            totalMatched++
            for (const action of actions.actions) {
              await db.adRuleLog.create({
                data: {
                  ruleId: rule.id,
                  action: action.type,
                  details: { campaignId: campaign.id, campaignName: campaign.name, params: (action.params ?? null) as Record<string, string> },
                  entityId: campaign.id,
                },
              })
            }
          }
        }

        await db.adRule.update({
          where: { id: rule.id },
          data: { lastRunAt: new Date(), runCount: { increment: 1 } },
        })
      }

      summary.push({ organizationId, rulesProcessed: activeRules.length, totalMatched })
    }

    return Response.json({
      message: "Rules check complete",
      organizations: summary.length,
      summary,
    })
  } catch (error) {
    console.error("Cron check-rules error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getMetric(metrics: Record<string, unknown>, key: string): number {
  const val = metrics[key]
  return typeof val === "number" ? val : 0
}

function evalCond(metricValue: number, operator: string, value: number): boolean {
  switch (operator) {
    case "gt": return metricValue > value
    case "gte": return metricValue >= value
    case "lt": return metricValue < value
    case "lte": return metricValue <= value
    case "eq": return metricValue === value
    default: return false
  }
}
