"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { MetricCard } from "@/components/ads/metric-card"
import { PerformanceChart } from "@/components/ads/performance-chart"
import { HourlyHeatmap } from "@/components/ads/hourly-heatmap"
import { BudgetPacer } from "@/components/ads/budget-pacer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  MousePointerClick,
  Percent,
} from "lucide-react"
import {
  getAdsDashboardData,
  getAdsPerformanceTrend,
  getTopCampaigns,
  getHourlyPerformance,
} from "@/server/actions/ads-dashboard"

interface DashboardData {
  totalSpend: number
  roas: number
  cpa: number
  cpm: number
  cpc: number
  ctr: number
}

interface TrendPoint {
  date: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
}

interface Campaign {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  ctr: string
  cpc: string
  conversions: number
  roas: string
  budget: number
}

interface HeatmapPoint {
  day: number
  hour: number
  value: number
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDING_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "ทำงาน",
  PAUSED: "หยุด",
  COMPLETED: "เสร็จ",
  PENDING_REVIEW: "รอตรวจ",
  DRAFT: "แบบร่าง",
}

export default function AdsDashboardPage() {
  const [dateRange, setDateRange] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, t, c, h] = await Promise.all([
        getAdsDashboardData(dateRange),
        getAdsPerformanceTrend(dateRange),
        getTopCampaigns(10),
        getHourlyPerformance(dateRange),
      ])
      setData(d)
      setTrend(t as TrendPoint[])
      setCampaigns(c as Campaign[])
      setHeatmap(h)
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div>
        <PageHeader heading="Ads Dashboard" description="ภาพรวมประสิทธิภาพโฆษณา" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6"><Skeleton className="h-[400px] w-full rounded-lg" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Ads Dashboard"
        description="ภาพรวมประสิทธิภาพโฆษณาทุกแพลตฟอร์ม"
      />

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="ค่าใช้จ่ายรวม"
          value={`฿${(data?.totalSpend ?? 0).toLocaleString()}`}
          icon={DollarSign}
          sparklineData={trend.map((t) => t.spend)}
        />
        <MetricCard
          title="ROAS"
          value={`${(data?.roas ?? 0).toFixed(2)}x`}
          icon={TrendingUp}
        />
        <MetricCard
          title="CPA"
          value={`฿${(data?.cpa ?? 0).toFixed(0)}`}
          icon={Target}
          invertColors
        />
        <MetricCard
          title="CPM"
          value={`฿${(data?.cpm ?? 0).toFixed(0)}`}
          icon={BarChart3}
          invertColors
        />
        <MetricCard
          title="CPC"
          value={`฿${(data?.cpc ?? 0).toFixed(2)}`}
          icon={MousePointerClick}
          invertColors
        />
        <MetricCard
          title="CTR"
          value={`${(data?.ctr ?? 0).toFixed(2)}%`}
          icon={Percent}
        />
      </div>

      {/* Performance Trend Chart */}
      <PerformanceChart
        data={trend}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">แคมเปญ</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Spend</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">CTR</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">ROAS</th>
                    <th className="pb-2 font-medium text-muted-foreground text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        ไม่มีแคมเปญ
                      </td>
                    </tr>
                  )}
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5">
                        <Link href={`/ads/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        ฿{c.spend.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{c.ctr}%</td>
                      <td className="py-2.5 text-right tabular-nums">{c.roas}x</td>
                      <td className="py-2.5 text-center">
                        <Badge variant="secondary" className={STATUS_COLORS[c.status] ?? ""}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Budget Pacer */}
        <BudgetPacer
          campaigns={campaigns
            .filter((c) => c.budget > 0)
            .map((c) => ({
              id: c.id,
              name: c.name,
              spent: c.spend,
              budget: c.budget,
              daysLeft: 15,
              totalDays: 30,
            }))}
        />
      </div>

      {/* Hourly Heatmap */}
      <HourlyHeatmap data={heatmap} label="CTR" />
    </div>
  )
}
