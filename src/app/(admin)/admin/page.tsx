"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Shield,
  Building2,
  Users,
  Megaphone,
  Target,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { toast } from "sonner"
import { getPlatformAnalytics } from "@/server/actions/admin"

interface Analytics {
  totalOrgs: number
  totalUsers: number
  totalCampaigns: number
  totalLeads: number
  newOrgsThisMonth: number
  newUsersThisMonth: number
  orgGrowth: number
  userGrowth: number
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<Analytics | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const analytics = await getPlatformAnalytics()
      setData(analytics)
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Admin Dashboard" description="Platform-wide administration and analytics" />

      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Organizations"
            value={String(data.totalOrgs)}
            icon={Building2}
            change={`${data.newOrgsThisMonth} this month`}
            changeType={data.orgGrowth >= 0 ? "positive" : "negative"}
          />
          <StatCard
            title="Total Users"
            value={String(data.totalUsers)}
            icon={Users}
            change={`${data.newUsersThisMonth} this month`}
            changeType={data.userGrowth >= 0 ? "positive" : "negative"}
          />
          <StatCard title="Total Campaigns" value={String(data.totalCampaigns)} icon={Megaphone} />
          <StatCard title="Total Leads" value={String(data.totalLeads)} icon={Target} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View and manage all organizations registered on the platform</p>
            <Button variant="ghost" size="sm" className="mt-4" asChild>
              <Link href="/admin/organizations">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage all users across the platform, roles and permissions</p>
            <Button variant="ghost" size="sm" className="mt-4" asChild>
              <Link href="/admin/users">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />Platform Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View platform-wide metrics, usage stats, and growth trends</p>
            <Button variant="ghost" size="sm" className="mt-4" asChild>
              <Link href="/admin/analytics">View <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
