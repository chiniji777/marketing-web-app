"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { serializePrisma } from "@/lib/serialize"

// ─── Dashboard Summary ──────────────────────────────────────

export async function getAdsDashboardData(dateRange: string = "30d") {
  const { db } = await getOrgContext()
  const days = parseInt(dateRange) || 30
  const since = new Date()
  since.setDate(since.getDate() - days)

  const campaigns = await db.adsCampaign.findMany({
    where: { status: { not: "DRAFT" } },
    select: {
      id: true,
      performanceData: true,
    },
  })

  let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalConversions = 0

  for (const c of campaigns) {
    const perf = c.performanceData as Record<string, number> | null
    if (perf) {
      totalSpend += perf.spend ?? 0
      totalImpressions += perf.impressions ?? 0
      totalClicks += perf.clicks ?? 0
      totalConversions += perf.conversions ?? 0
    }
  }

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0
  const roas = totalSpend > 0 ? (totalConversions * 500) / totalSpend : 0 // Assumed avg conversion value

  return {
    totalSpend,
    roas,
    cpa,
    cpm,
    cpc,
    ctr,
    totalImpressions,
    totalClicks,
    totalConversions,
  }
}

// ─── Performance Trend ──────────────────────────────────────

export async function getAdsPerformanceTrend(dateRange: string = "30d") {
  const { db } = await getOrgContext()
  const days = parseInt(dateRange) || 30

  // Try to get from CampaignAnalytics if exists
  try {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const analytics = await db.campaignAnalytics.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
      select: {
        date: true,
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
    })

    if (analytics.length > 0) {
      // Group by date
      const grouped = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number }>()
      for (const a of analytics) {
        const key = new Date(a.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })
        const existing = grouped.get(key) ?? { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
        existing.spend += Number(a.spend ?? 0)
        existing.impressions += Number(a.impressions ?? 0)
        existing.clicks += Number(a.clicks ?? 0)
        existing.conversions += Number(a.conversions ?? 0)
        grouped.set(key, existing)
      }

      return Array.from(grouped.entries()).map(([date, d]) => ({
        date,
        ...d,
      }))
    }
  } catch {
    // CampaignAnalytics may not exist yet
  }

  // Fallback: generate mock trend data
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return {
      date: d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" }),
      spend: Math.round(Math.random() * 5000 + 1000),
      impressions: Math.round(Math.random() * 50000 + 10000),
      clicks: Math.round(Math.random() * 2000 + 200),
      conversions: Math.round(Math.random() * 50 + 5),
    }
  })
}

// ─── Top Campaigns ──────────────────────────────────────────

export async function getTopCampaigns(limit: number = 10) {
  const { db } = await getOrgContext()

  const campaigns = await db.adsCampaign.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      status: true,
      platform: true,
      totalBudget: true,
      performanceData: true,
    },
  })

  return serializePrisma(
    campaigns.map((c) => {
      const perf = c.performanceData as Record<string, number> | null
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        platform: c.platform,
        budget: Number(c.totalBudget ?? 0),
        spend: perf?.spend ?? 0,
        impressions: perf?.impressions ?? 0,
        clicks: perf?.clicks ?? 0,
        ctr: (perf?.impressions ?? 0) > 0
          ? (((perf?.clicks ?? 0) / (perf?.impressions ?? 1)) * 100).toFixed(2)
          : "0.00",
        cpc: (perf?.clicks ?? 0) > 0
          ? ((perf?.spend ?? 0) / (perf?.clicks ?? 1)).toFixed(2)
          : "0.00",
        conversions: perf?.conversions ?? 0,
        roas: (perf?.spend ?? 0) > 0
          ? (((perf?.conversions ?? 0) * 500) / (perf?.spend ?? 1)).toFixed(2)
          : "0.00",
      }
    })
  )
}

// ─── Hourly Performance ─────────────────────────────────────

export async function getHourlyPerformance(_dateRange: string = "7d") {
  // CampaignAnalytics doesn't have hourly breakdown yet
  // Generate sample data — will be replaced when AdPerformanceSnapshot is ready
  const data: { day: number; hour: number; value: number }[] = []
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      // Simulate higher CTR during business hours
      const base = (h >= 8 && h <= 20) ? 2.5 : 0.8
      const weekend = (d >= 5) ? 0.7 : 1
      data.push({
        day: d,
        hour: h,
        value: Math.round((base * weekend + Math.random() * 1.5) * 100) / 100,
      })
    }
  }
  return data
}
