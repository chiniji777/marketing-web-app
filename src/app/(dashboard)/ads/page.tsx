"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Target,
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Trash2,
  Pause,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import { getAdsCampaigns, getAdsStats, updateAdsCampaign, deleteAdsCampaign } from "@/server/actions/ads"

const PLATFORM_OPTIONS = [
  { value: "all", label: "All Platforms" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TWITTER", label: "Twitter/X" },
  { value: "YOUTUBE", label: "YouTube" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
]

interface AdsCampaign {
  id: string
  name: string
  platform: string
  objective: string
  status: string
  dailyBudget: unknown
  totalBudget: unknown
  performanceData: Record<string, number> | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  adSets: { id: string; name: string; metrics: Record<string, number> | null; status: string }[]
}

interface Stats {
  totalCampaigns: number
  active: number
  totalSpend: number
  totalBudget: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  ctr: number
  conversionRate: number
  totalSets: number
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING_REVIEW: { label: "Pending Review", variant: "outline" },
  ACTIVE: { label: "Active", variant: "default" },
  PAUSED: { label: "Paused", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
}

export default function AdsPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([])
  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    try {
      const [statsData, campsData] = await Promise.all([
        getAdsStats(),
        getAdsCampaigns({
          search: search || undefined,
          platform: platformFilter !== "all" ? platformFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          perPage: 20,
        }),
      ])
      setStats(statsData)
      setCampaigns(campsData.campaigns as unknown as AdsCampaign[])
      setTotalPages(campsData.pagination.totalPages)
    } catch {
      toast.error("Failed to load ads data")
    } finally {
      setIsLoading(false)
    }
  }, [search, platformFilter, statusFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateAdsCampaign({ id, status: newStatus as "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "PAUSED" | "COMPLETED" | "REJECTED" })
      toast.success(`Campaign ${newStatus.toLowerCase()}`)
      fetchData()
    } catch {
      toast.error("Failed to update campaign")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdsCampaign(id)
      toast.success("Campaign deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete campaign")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.ads.title} description={t.ads.subtitle}>
        <Button asChild>
          <Link href="/ads/create"><Plus className="mr-2 h-4 w-4" />Create Campaign</Link>
        </Button>
      </PageHeader>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t.ads.totalCampaigns} value={String(stats.totalCampaigns)} icon={Target} change={`${stats.active} active`} changeType="positive" />
          <StatCard title={t.ads.totalSpend} value={`฿${stats.totalSpend.toLocaleString()}`} icon={DollarSign} description={`of ฿${stats.totalBudget.toLocaleString()} budget`} />
          <StatCard title={t.ads.avgCtr} value={stats.totalImpressions.toLocaleString()} icon={Eye} change={`${stats.ctr}% CTR`} changeType="positive" />
          <StatCard title={t.ads.conversions} value={String(stats.totalConversions)} icon={TrendingUp} change={`${stats.conversionRate}% rate`} changeType="positive" />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {campaigns.length === 0 ? (
        <EmptyState icon={Target} title="No ad campaigns" description="Create your first ad campaign with AI-powered optimization">
          <Button asChild>
            <Link href="/ads/create"><Plus className="mr-2 h-4 w-4" />Create Campaign</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const cfg = statusConfig[campaign.status] ?? { label: campaign.status, variant: "outline" as const }
            const perf = campaign.performanceData ?? {}
            const totalImpressions = Number(perf.impressions ?? 0)
            const totalClicks = Number(perf.clicks ?? 0)
            const _totalConversions = Number(perf.conversions ?? 0)

            return (
              <Card key={campaign.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{campaign.name}</h3>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <Badge variant="outline">{campaign.platform}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground capitalize">{campaign.objective.toLowerCase().replace(/_/g, " ")}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Spend: ฿{Number(perf.spend ?? 0).toLocaleString()}
                          {campaign.totalBudget != null && Number(campaign.totalBudget) > 0 ? (
                            <span> / ฿{Number(campaign.totalBudget).toLocaleString()}</span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />{totalImpressions.toLocaleString()} impr.
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />{totalClicks.toLocaleString()} clicks
                        </span>
                        <span>{campaign.adSets.length} ad set{campaign.adSets.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {campaign.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "ACTIVE")}>
                            <Play className="mr-2 h-3.5 w-3.5" />Activate
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "PAUSED")}>
                            <Pause className="mr-2 h-3.5 w-3.5" />Pause
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "PAUSED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "ACTIVE")}>
                            <Play className="mr-2 h-3.5 w-3.5" />Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(campaign.id)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
