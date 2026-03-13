"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { revalidatePath } from "next/cache"
import { updateFacebookCampaignStatus, updateFacebookCampaign } from "./ads"

// ─── Types ────────────────────────────────────────────

type ConditionOperator = "gt" | "gte" | "lt" | "lte" | "eq"
type ConditionMetric = "cpa" | "cpc" | "cpm" | "ctr" | "roas" | "spend" | "impressions" | "clicks" | "conversions" | "frequency"
type ActionType = "pause_campaign" | "resume_campaign" | "adjust_budget" | "send_alert"

interface RuleCondition {
  metric: ConditionMetric
  operator: ConditionOperator
  value: number
}

interface RuleAction {
  type: ActionType
  params?: Record<string, unknown>
}

interface RuleInput {
  name: string
  description?: string
  conditions: { conditions: RuleCondition[]; logic: "AND" | "OR" }
  actions: { actions: RuleAction[] }
  scope: { campaignIds?: string[]; platform?: string }
  schedule?: string
}

interface UpdateRuleInput extends Partial<RuleInput> {
  id: string
}

// ─── CRUD ────────────────────────────────────────────

export async function getAdRules(filters?: { isActive?: boolean }) {
  const { db } = await getOrgContext()

  const where: Record<string, unknown> = {}
  if (filters?.isActive !== undefined) where.isActive = filters.isActive

  const rules = await db.adRule.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { logs: true } } },
  })

  return rules
}

export async function getAdRule(id: string) {
  const { db } = await getOrgContext()

  const rule = await db.adRule.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!rule) throw new Error("Rule not found")
  return rule
}

export async function createAdRule(input: RuleInput) {
  const { db, organizationId } = await getOrgContext()

  if (!input.name) throw new Error("name is required")
  if (!input.conditions?.conditions?.length) throw new Error("At least one condition is required")
  if (!input.actions?.actions?.length) throw new Error("At least one action is required")

  const rule = await db.adRule.create({
    data: {
      name: input.name,
      description: input.description || null,
      conditions: JSON.parse(JSON.stringify(input.conditions)),
      actions: JSON.parse(JSON.stringify(input.actions)),
      scope: input.scope ? JSON.parse(JSON.stringify(input.scope)) : {},
      schedule: input.schedule || null,
      organizationId,
    },
  })

  revalidatePath("/ads")
  return rule
}

export async function updateAdRule(input: UpdateRuleInput) {
  const { db } = await getOrgContext()

  const existing = await db.adRule.findUnique({ where: { id: input.id } })
  if (!existing) throw new Error("Rule not found")

  const data: Record<string, unknown> = {}
  if (input.name !== undefined) data.name = input.name
  if (input.description !== undefined) data.description = input.description
  if (input.conditions !== undefined) data.conditions = input.conditions
  if (input.actions !== undefined) data.actions = input.actions
  if (input.scope !== undefined) data.scope = input.scope
  if (input.schedule !== undefined) data.schedule = input.schedule

  const rule = await db.adRule.update({
    where: { id: input.id },
    data,
  })

  revalidatePath("/ads")
  return rule
}

export async function deleteAdRule(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adRule.findUnique({ where: { id } })
  if (!existing) throw new Error("Rule not found")

  await db.adRule.delete({ where: { id } })

  revalidatePath("/ads")
  return { success: true }
}

export async function toggleAdRule(id: string) {
  const { db } = await getOrgContext()

  const existing = await db.adRule.findUnique({ where: { id } })
  if (!existing) throw new Error("Rule not found")

  const rule = await db.adRule.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  revalidatePath("/ads")
  return rule
}

// ─── Rule Evaluation ────────────────────────────────────

function evaluateCondition(metric: number, operator: ConditionOperator, value: number): boolean {
  switch (operator) {
    case "gt": return metric > value
    case "gte": return metric >= value
    case "lt": return metric < value
    case "lte": return metric <= value
    case "eq": return metric === value
    default: return false
  }
}

function getMetricValue(metrics: Record<string, unknown>, metricName: ConditionMetric): number {
  const val = metrics[metricName]
  return typeof val === "number" ? val : 0
}

function matchesConditions(
  metrics: Record<string, unknown>,
  conditions: RuleCondition[],
  logic: "AND" | "OR"
): boolean {
  if (logic === "AND") {
    return conditions.every((c) => evaluateCondition(getMetricValue(metrics, c.metric), c.operator, c.value))
  }
  return conditions.some((c) => evaluateCondition(getMetricValue(metrics, c.metric), c.operator, c.value))
}

async function executeActions(
  db: ReturnType<typeof import("@/lib/prisma-extension").getTenantPrisma>,
  campaignId: string,
  actions: RuleAction[],
  ruleId: string,
  dryRun: boolean
): Promise<{ action: string; details: Record<string, unknown> }[]> {
  const results: { action: string; details: Record<string, unknown> }[] = []

  for (const action of actions) {
    if (dryRun) {
      results.push({ action: action.type, details: { dryRun: true, campaignId, params: action.params } })
      continue
    }

    try {
      switch (action.type) {
        case "pause_campaign":
          await updateFacebookCampaignStatus(campaignId, "PAUSED")
          results.push({ action: "pause_campaign", details: { campaignId, status: "PAUSED" } })
          break

        case "resume_campaign":
          await updateFacebookCampaignStatus(campaignId, "ACTIVE")
          results.push({ action: "resume_campaign", details: { campaignId, status: "ACTIVE" } })
          break

        case "adjust_budget": {
          const changePct = (action.params?.change_pct as number) || 0
          const campaign = await db.adsCampaign.findUnique({ where: { id: campaignId } })
          if (campaign?.dailyBudget) {
            const newBudget = Math.round(Number(campaign.dailyBudget) * (1 + changePct / 100))
            await updateFacebookCampaign(campaignId, { dailyBudget: newBudget })
            results.push({ action: "adjust_budget", details: { campaignId, oldBudget: campaign.dailyBudget, newBudget, changePct } })
          }
          break
        }

        case "send_alert": {
          const channels = (action.params?.channels as string[]) || ["in_app"]
          // Create in-app notification
          if (channels.includes("in_app")) {
            // Log as alert notification — actual notification creation handled by caller
            results.push({ action: "send_alert", details: { campaignId, channels } })
          }
          break
        }
      }
    } catch (error) {
      results.push({ action: action.type, details: { campaignId, error: String(error) } })
    }
  }

  return results
}

export async function evaluateRules() {
  const { db } = await getOrgContext()

  const activeRules = await db.adRule.findMany({
    where: { isActive: true },
  })

  const summary: { ruleId: string; ruleName: string; matchedCampaigns: number; actions: unknown[] }[] = []

  for (const rule of activeRules) {
    const conditions = rule.conditions as unknown as { conditions: RuleCondition[]; logic: "AND" | "OR" }
    const actions = rule.actions as unknown as { actions: RuleAction[] }
    const scope = rule.scope as unknown as { campaignIds?: string[]; platform?: string }

    // Get campaigns in scope
    const campaignWhere: Record<string, unknown> = {}
    if (scope.campaignIds?.length) {
      campaignWhere.id = { in: scope.campaignIds }
    }
    if (scope.platform) {
      campaignWhere.platform = scope.platform
    }

    const campaigns = await db.adsCampaign.findMany({ where: campaignWhere })

    let matchedCount = 0
    const ruleActions: unknown[] = []

    for (const campaign of campaigns) {
      const metrics = (campaign.performanceData as Record<string, unknown>) || {}
      if (matchesConditions(metrics, conditions.conditions, conditions.logic)) {
        matchedCount++
        const results = await executeActions(db, campaign.id, actions.actions, rule.id, false)
        ruleActions.push(...results)

        // Log each action
        for (const result of results) {
          await db.adRuleLog.create({
            data: {
              ruleId: rule.id,
              action: result.action,
              details: result.details as Record<string, string>,
              entityId: campaign.id,
            },
          })
        }
      }
    }

    // Update rule lastRunAt and runCount
    await db.adRule.update({
      where: { id: rule.id },
      data: { lastRunAt: new Date(), runCount: { increment: 1 } },
    })

    summary.push({
      ruleId: rule.id,
      ruleName: rule.name,
      matchedCampaigns: matchedCount,
      actions: ruleActions,
    })
  }

  return summary
}

export async function dryRunRule(id: string) {
  const { db } = await getOrgContext()

  const rule = await db.adRule.findUnique({ where: { id } })
  if (!rule) throw new Error("Rule not found")

  const conditions = rule.conditions as unknown as { conditions: RuleCondition[]; logic: "AND" | "OR" }
  const actions = rule.actions as unknown as { actions: RuleAction[] }
  const scope = rule.scope as unknown as { campaignIds?: string[]; platform?: string }

  const campaignWhere: Record<string, unknown> = {}
  if (scope.campaignIds?.length) {
    campaignWhere.id = { in: scope.campaignIds }
  }
  if (scope.platform) {
    campaignWhere.platform = scope.platform
  }

  const campaigns = await db.adsCampaign.findMany({ where: campaignWhere })

  const matched: { campaignId: string; campaignName: string; metrics: unknown; wouldExecute: unknown[] }[] = []

  for (const campaign of campaigns) {
    const metrics = (campaign.performanceData as Record<string, unknown>) || {}
    if (matchesConditions(metrics, conditions.conditions, conditions.logic)) {
      const results = await executeActions(db, campaign.id, actions.actions, rule.id, true)
      matched.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        metrics,
        wouldExecute: results,
      })
    }
  }

  return {
    rule: { id: rule.id, name: rule.name },
    totalCampaignsChecked: campaigns.length,
    matchedCampaigns: matched.length,
    matches: matched,
  }
}
