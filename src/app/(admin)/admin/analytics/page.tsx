"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart3,
  Building2,
  Users,
  Megaphone,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"
import { getPlatformAnalytics } from "@/server/actions/admin"

interface Analytics {
  organizations: { total: number; thisMonth: number; lastMonth: number }
  users: { total: number; thisMonth: number; lastMonth: number }
  campaigns: { total: number; thisMonth: number; lastMonth: number }
  leads: { total: number; thisMonth: number; lastMonth: number }
}

function GrowthIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pctChange = Math.round(((current - previous) / previous) * 100)
  const isPositive = pctChange >= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{pctChange}%
    </span>
  )
}

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getPlatformAnalytics()
      setAnalytics(data as unknown as Analytics)
    } catch {
      toast.error("Failed to load analytics")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  const metrics = analytics ? [
    {
      title: "Total Organizations",
      value: analytics.organizations.total,
      thisMonth: analytics.organizations.thisMonth,
      lastMonth: analytics.organizations.lastMonth,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Total Users",
      value: analytics.users.total,
      thisMonth: analytics.users.thisMonth,
      lastMonth: analytics.users.lastMonth,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Total Campaigns",
      value: analytics.campaigns.total,
      thisMonth: analytics.campaigns.thisMonth,
      lastMonth: analytics.campaigns.lastMonth,
      icon: Megaphone,
      color: "text-orange-600",
    },
    {
      title: "Total Leads",
      value: analytics.leads.total,
      thisMonth: analytics.leads.thisMonth,
      lastMonth: analytics.leads.lastMonth,
      icon: Target,
      color: "text-emerald-600",
    },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader heading="Platform Analytics" description="Platform-wide usage and revenue analytics" />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{m.title}</p>
                    <p className="text-2xl font-bold">{m.value.toLocaleString()}</p>
                    <GrowthIndicator current={m.thisMonth} previous={m.lastMonth} />
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${m.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Monthly Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Month vs Last Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((m) => (
                <div key={m.title} className="flex items-center justify-between">
                  <span className="text-sm">{m.title}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Last: {m.lastMonth}</span>
                    <span className="font-medium">This: {m.thisMonth}</span>
                    <GrowthIndicator current={m.thisMonth} previous={m.lastMonth} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Users per Org</span>
                <span className="font-medium">
                  {analytics && analytics.organizations.total > 0
                    ? (analytics.users.total / analytics.organizations.total).toFixed(1)
                    : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Campaigns per Org</span>
                <span className="font-medium">
                  {analytics && analytics.organizations.total > 0
                    ? (analytics.campaigns.total / analytics.organizations.total).toFixed(1)
                    : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Leads per Org</span>
                <span className="font-medium">
                  {analytics && analytics.organizations.total > 0
                    ? (analytics.leads.total / analytics.organizations.total).toFixed(1)
                    : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Orgs Growth Rate</span>
                <span className="font-medium">
                  {analytics && analytics.organizations.lastMonth > 0
                    ? `${Math.round(((analytics.organizations.thisMonth - analytics.organizations.lastMonth) / analytics.organizations.lastMonth) * 100)}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
