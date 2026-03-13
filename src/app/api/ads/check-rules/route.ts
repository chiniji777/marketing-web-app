import { prisma } from "@/lib/prisma"
import { getTenantPrisma } from "@/lib/prisma-extension"
import {
  updateCampaign as fbUpdateCampaign,
} from "@/lib/facebook"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const orgsWithRules = await prisma.adRule.findMany({
      where: { isActive: true },
      select: { organizationId: true },
      distinct: ["organizationId"],
    })

    const summary: { organizationId: string; rulesProcessed: number; totalMatched: number; actionsExecuted: number }[] = []

    for (const { organizationId } of orgsWithRules) {
      const db = getTenantPrisma(organizationId)

      const activeRules = await db.adRule.findMany({
        where: { isActive: true },
      })

      let totalMatched = 0
      let actionsExecuted = 0

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
              try {
                await executeAction(db, campaign, action)
                actionsExecuted++
              } catch (err) {
                console.error(`Rule ${rule.id} action ${action.type} failed for campaign ${campaign.id}:`, err)
              }

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

      summary.push({ organizationId, rulesProcessed: activeRules.length, totalMatched, actionsExecuted })
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

async function executeAction(
  db: ReturnType<typeof getTenantPrisma>,
  campaign: { id: string; platformCampaignId: string | null; facebookAdAccountId: string | null; dailyBudget: unknown },
  action: { type: string; params?: Record<string, unknown> }
) {
  if (!campaign.platformCampaignId || !campaign.facebookAdAccountId) return

  const fbAccount = await db.facebookAdAccount.findFirst({
    where: { id: campaign.facebookAdAccountId, isActive: true },
    include: { socialAccount: { select: { accessToken: true } } },
  })
  if (!fbAccount) return

  const accessToken = fbAccount.socialAccount.accessToken

  switch (action.type) {
    case "pause_campaign":
      await fbUpdateCampaign(campaign.platformCampaignId, accessToken, { status: "PAUSED" })
      await db.adsCampaign.update({ where: { id: campaign.id }, data: { status: "PAUSED" } })
      break

    case "resume_campaign":
      await fbUpdateCampaign(campaign.platformCampaignId, accessToken, { status: "ACTIVE" })
      await db.adsCampaign.update({ where: { id: campaign.id }, data: { status: "ACTIVE" } })
      break

    case "adjust_budget": {
      const changePct = (action.params?.change_pct as number) || 0
      const currentBudget = Number(campaign.dailyBudget ?? 0)
      if (currentBudget > 0) {
        const newBudget = Math.round(currentBudget * (1 + changePct / 100))
        await fbUpdateCampaign(campaign.platformCampaignId, accessToken, { dailyBudget: newBudget })
        await db.adsCampaign.update({ where: { id: campaign.id }, data: { dailyBudget: newBudget } })
      }
      break
    }

    case "send_alert": {
      const orgMember = await db.membership.findFirst({
        where: { organizationId: fbAccount.organizationId, role: "ADMIN" },
        select: { userId: true },
      })
      if (orgMember) {
        await db.notification.create({
          data: {
            userId: orgMember.userId,
            organizationId: fbAccount.organizationId,
            title: `Rule Alert: Campaign "${campaign.id}"`,
            message: `Auto-rule triggered for campaign. Action: send_alert`,
            type: "AD_ALERT",
            metadata: { campaignId: campaign.id },
          },
        })
      }
      break
    }
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
