"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  Target,
  FileText,
  MessageCircle,
  Mail,
  Megaphone,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ThumbsUp,
  ArrowRight,
} from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getDashboardData } from "@/server/actions/dashboard"
import { useTranslations } from "@/hooks/use-locale"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  COMPLETED: "secondary",
  DRAFT: "outline",
  PAUSED: "outline",
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

interface DashboardData {
  campaigns: { total: number; active: number; totalBudget: number; totalSpent: number }
  content: { total: number; published: number; scheduled: number; drafts: number }
  mentions: { total: number; positive: number; negative: number; neutral: number }
  leads: { total: number; newThisMonth: number; qualified: number; converted: number }
  email: { totalSubscribers: number; activeCampaigns: number }
  recentCampaigns: Array<{
    id: string; name: string; status: string; type: string
    budget: number | string | null; spentAmount: number | string
    channels: string[]; _count: { content: number }
  }>
  recentContent: Array<{
    id: string; title: string; contentType: string; status: string; createdAt: string | Date
  }>
  recentMentions: Array<{
    id: string; platform: string; content: string; sentiment: string | null
    authorName: string | null; mentionedAt: string | Date
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations()

  const fetchData = useCallback(async () => {
    try {
      const result = await getDashboardData()
      setData(result as unknown as DashboardData)
    } catch {
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader heading={t.dashboard.title} description={t.dashboard.subtitle} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        </div>
      </div>
    )
  }

  const d = data ?? {
    campaigns: { total: 0, active: 0, totalBudget: 0, totalSpent: 0 },
    content: { total: 0, published: 0, scheduled: 0, drafts: 0 },
    mentions: { total: 0, positive: 0, negative: 0, neutral: 0 },
    leads: { total: 0, newThisMonth: 0, qualified: 0, converted: 0 },
    email: { totalSubscribers: 0, activeCampaigns: 0 },
    recentCampaigns: [],
    recentContent: [],
    recentMentions: [],
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.dashboard.title} description={t.dashboard.subtitle} />

      {/* KPI Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t.dashboard.activeCampaigns} value={d.campaigns.active.toString()} icon={Megaphone} change={d.campaigns.total > 0 ? `${d.campaigns.total} ${t.common.total.toLowerCase()}` : undefined} changeType="positive" description="running campaigns" />
        <StatCard title={t.content.totalContent} value={d.content.total.toString()} icon={FileText} change={d.content.published > 0 ? `${d.content.published} ${t.content.published.toLowerCase()}` : undefined} changeType="positive" description={`${d.content.drafts} ${t.content.drafts.toLowerCase()}, ${d.content.scheduled} ${t.content.scheduled.toLowerCase()}`} />
        <StatCard title={t.social.totalMentions} value={d.mentions.total.toString()} icon={MessageCircle} change={d.mentions.positive > 0 ? `${Math.round((d.mentions.positive / Math.max(d.mentions.total, 1)) * 100)}% ${t.social.positiveSentiment.toLowerCase()}` : undefined} changeType="positive" description="across all platforms" />
        <StatCard title={t.leads.totalLeads} value={d.leads.total.toString()} icon={Users} change={d.leads.newThisMonth > 0 ? `+${d.leads.newThisMonth} ${t.dashboard.thisMonth}` : undefined} changeType="positive" description={`${d.leads.qualified} ${t.leads.qualified.toLowerCase()}`} />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Budget" value={`฿${d.campaigns.totalBudget.toLocaleString()}`} icon={DollarSign} description={`฿${d.campaigns.totalSpent.toLocaleString()} spent`} />
        <StatCard title="Email Subscribers" value={d.email.totalSubscribers.toLocaleString()} icon={Mail} description={`${d.email.activeCampaigns} active campaigns`} />
        <StatCard title="Positive Sentiment" value={d.mentions.total > 0 ? `${Math.round((d.mentions.positive / d.mentions.total) * 100)}%` : "N/A"} icon={ThumbsUp} changeType="positive" description={`${d.mentions.positive} positive mentions`} />
        <StatCard title="Leads Converted" value={d.leads.converted.toString()} icon={TrendingUp} change={d.leads.total > 0 ? `${Math.round((d.leads.converted / d.leads.total) * 100)}% rate` : undefined} changeType="positive" description="total conversions" />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Campaign Summary */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t.dashboard.recentCampaigns}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/campaigns">{t.common.viewAll}<ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.recentCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/campaigns/create">Create Campaign</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {d.recentCampaigns.map((campaign) => (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{campaign.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[campaign.status] ?? "outline"} className="text-xs">{campaign.status}</Badge>
                        <div className="flex gap-0.5">
                          {campaign.channels.slice(0, 3).map((ch) => {
                            const Icon = PLATFORM_ICONS[ch] ?? Globe
                            return <Icon key={ch} className="h-3 w-3 text-muted-foreground" />
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {Number(campaign.budget ?? 0) > 0 && (
                        <p className="text-sm font-medium">฿{Number(campaign.spentAmount).toLocaleString()} / ฿{Number(campaign.budget).toLocaleString()}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{campaign._count.content} content</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-5 w-5" />{t.dashboard.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: "Create Post", icon: Zap, href: "/content/generator" },
                { label: "New Campaign", icon: Target, href: "/campaigns/create" },
                { label: "View Leads", icon: Users, href: "/leads" },
                { label: "Send Email", icon: Mail, href: "/email/compose" },
              ].map((action) => (
                <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-muted">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Mentions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Recent Mentions
                <Button variant="ghost" size="sm" asChild><Link href="/social-listening">View All</Link></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {d.recentMentions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No mentions yet</p>
              ) : (
                <div className="space-y-3">
                  {d.recentMentions.map((mention) => {
                    const PlatformIcon = PLATFORM_ICONS[mention.platform] ?? Globe
                    return (
                      <div key={mention.id} className="flex items-start gap-3">
                        <PlatformIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm">{mention.content}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{mention.authorName ?? "Unknown"}</span>
                            {mention.sentiment && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{mention.sentiment}</Badge>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Latest Content
                <Button variant="ghost" size="sm" asChild><Link href="/content">View All</Link></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {d.recentContent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No content yet</p>
              ) : (
                <div className="space-y-3">
                  {d.recentContent.map((item) => (
                    <Link key={item.id} href={`/content/${item.id}`} className="flex items-center justify-between rounded-lg border p-2.5 transition-colors hover:bg-muted/50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.contentType.toLowerCase().replace("_", " ")}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs capitalize">{item.status.toLowerCase()}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
