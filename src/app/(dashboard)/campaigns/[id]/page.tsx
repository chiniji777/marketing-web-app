"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Pencil,
  Target,
  DollarSign,
  BarChart3,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Calendar,
  TrendingUp,
  Eye,
  MousePointerClick,
  Users,
  FileText,
  Play,
  Pause,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"
import { getCampaign, getCampaignAnalytics, updateCampaign } from "@/server/actions/campaign"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  DRAFT: { label: "Draft", variant: "secondary", color: "text-gray-600" },
  ACTIVE: { label: "Active", variant: "default", color: "text-green-600" },
  PAUSED: { label: "Paused", variant: "outline", color: "text-yellow-600" },
  COMPLETED: { label: "Completed", variant: "default", color: "text-blue-600" },
  ARCHIVED: { label: "Archived", variant: "secondary", color: "text-gray-500" },
}

const TYPE_LABELS: Record<string, string> = {
  BRAND_AWARENESS: "Brand Awareness",
  LEAD_GENERATION: "Lead Generation",
  SALES: "Sales",
  ENGAGEMENT: "Engagement",
  PRODUCT_LAUNCH: "Product Launch",
  EVENT: "Event",
  CUSTOM: "Custom",
}

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
  TIKTOK: Globe,
  PINTEREST: Globe,
}

interface AnalyticsDay {
  id: string
  date: string | Date
  impressions: number
  clicks: number
  conversions: number
  spend: number | string
  revenue: number | string
  engagements: number
  reach: number
}

interface CampaignDetail {
  id: string
  name: string
  description: string | null
  status: string
  type: string
  startDate: string | Date | null
  endDate: string | Date | null
  budget: number | string | null
  spentAmount: number | string
  goalType: string | null
  goalTarget: number | null
  goalCurrent: number
  channels: string[]
  createdAt: string | Date
  updatedAt: string | Date
  content: Array<{ id: string; title: string; contentType: string; status: string; createdAt: string | Date }>
  analytics: AnalyticsDay[]
  _count: { content: number; analytics: number; adsCampaigns: number; emailCampaigns: number }
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsDay[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [campaignData, analyticsData] = await Promise.all([
        getCampaign(id),
        getCampaignAnalytics(id, 30),
      ])
      setCampaign(campaignData as unknown as CampaignDetail)
      setAnalytics(analyticsData as unknown as AnalyticsDay[])
    } catch {
      toast.error("Failed to load campaign")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateCampaign({ id, status: newStatus as "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED" })
      toast.success(`Campaign ${newStatus.toLowerCase()}`)
      fetchData()
    } catch {
      toast.error("Failed to update status")
    }
  }

  const formatCurrency = (value: number | string | null) => {
    const num = Number(value ?? 0)
    return num.toLocaleString("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 })
  }

  // Aggregate analytics
  const totals = analytics.reduce(
    (acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      conversions: acc.conversions + day.conversions,
      spend: acc.spend + Number(day.spend),
      revenue: acc.revenue + Number(day.revenue),
      engagements: acc.engagements + day.engagements,
      reach: acc.reach + day.reach,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0, engagements: 0, reach: 0 }
  )

  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00"
  const convRate = totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) : "0.00"
  const roi = totals.spend > 0 ? (((totals.revenue - totals.spend) / totals.spend) * 100).toFixed(1) : "0.0"

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.DRAFT
  const budgetNum = Number(campaign.budget ?? 0)
  const spentNum = Number(campaign.spentAmount)
  const budgetPct = budgetNum > 0 ? Math.min(Math.round((spentNum / budgetNum) * 100), 100) : 0
  const goalPct = campaign.goalTarget && campaign.goalTarget > 0
    ? Math.min(Math.round((campaign.goalCurrent / campaign.goalTarget) * 100), 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              <Badge variant="outline">{TYPE_LABELS[campaign.type] ?? campaign.type}</Badge>
            </div>
            {campaign.description && (
              <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "DRAFT" && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange("ACTIVE")}>
              <Play className="mr-2 h-4 w-4" />Activate
            </Button>
          )}
          {campaign.status === "ACTIVE" && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange("PAUSED")}>
              <Pause className="mr-2 h-4 w-4" />Pause
            </Button>
          )}
          {campaign.status === "PAUSED" && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange("ACTIVE")}>
              <Play className="mr-2 h-4 w-4" />Resume
            </Button>
          )}
          {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange("COMPLETED")}>
              <CheckCircle className="mr-2 h-4 w-4" />Complete
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={`/campaigns/${id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link>
          </Button>
        </div>
      </div>

      {/* Performance KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.impressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <MousePointerClick className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.clicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Clicks ({ctr}% CTR)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.conversions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Conversions ({convRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totals.revenue)}</p>
                <p className="text-xs text-muted-foreground">Revenue ({roi}% ROI)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Daily Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Performance (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No analytics data yet. Performance data will appear once the campaign is running.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4 text-right">Impressions</th>
                        <th className="pb-2 pr-4 text-right">Clicks</th>
                        <th className="pb-2 pr-4 text-right">Conversions</th>
                        <th className="pb-2 pr-4 text-right">Spend</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.slice(0, 10).map((day) => (
                        <tr key={day.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                          <td className="py-2 pr-4 text-right">{day.impressions.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">{day.clicks.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">{day.conversions.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">{formatCurrency(day.spend)}</td>
                          <td className="py-2 text-right">{formatCurrency(day.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Campaign Content
                <Badge variant="secondary">{campaign._count.content}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.content.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">No content linked to this campaign yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaign.content.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Link href={`/content/${item.id}`} className="text-sm font-medium hover:underline">
                            {item.title}
                          </Link>
                          <p className="text-xs text-muted-foreground capitalize">{item.contentType.toLowerCase().replace("_", " ")}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{item.status.toLowerCase()}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetNum > 0 ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">{formatCurrency(campaign.spentAmount)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${budgetPct >= 90 ? "bg-red-500" : budgetPct >= 70 ? "bg-yellow-500" : "bg-primary"}`}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{budgetPct}% used</span>
                    <span>{formatCurrency(budgetNum - spentNum)} remaining</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No budget set</p>
              )}
            </CardContent>
          </Card>

          {/* Goal Progress */}
          {campaign.goalTarget && campaign.goalTarget > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goal Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{campaign.goalType}</span>
                  <span className="font-medium">{campaign.goalCurrent.toLocaleString()} / {campaign.goalTarget.toLocaleString()}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${goalPct >= 100 ? "bg-green-500" : goalPct >= 70 ? "bg-primary" : "bg-blue-400"}`}
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{goalPct}% achieved</p>
              </CardContent>
            </Card>
          )}

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Channels</span>
                <div className="flex gap-1">
                  {campaign.channels.map((ch) => {
                    const Icon = PLATFORM_ICONS[ch] ?? Globe
                    return <Icon key={ch} className="h-4 w-4 text-muted-foreground" />
                  })}
                </div>
              </div>
              {campaign.startDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Start</span>
                  <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {campaign.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">End</span>
                  <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Content</span>
                <span>{campaign._count.content} items</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ad Campaigns</span>
                <span>{campaign._count.adsCampaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email Campaigns</span>
                <span>{campaign._count.emailCampaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals (30 days)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reach</span>
                <span className="font-medium">{totals.reach.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Engagements</span>
                <span className="font-medium">{totals.engagements.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Spend</span>
                <span className="font-medium">{formatCurrency(totals.spend)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-medium">{formatCurrency(totals.revenue)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
