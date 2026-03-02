"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/shared/stat-card"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Megaphone,
  Target,
  DollarSign,
  BarChart3,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Play,
  Pause,
  CheckCircle,
  Archive,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import {
  getCampaigns,
  getCampaignSummary,
  deleteCampaign,
  duplicateCampaign,
  updateCampaign,
} from "@/server/actions/campaign"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Active", variant: "default" },
  PAUSED: { label: "Paused", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
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

interface CampaignItem {
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
  _count: { content: number; analytics: number }
}

interface Summary {
  total: number
  active: number
  draft: number
  completed: number
  totalBudget: number
  totalSpent: number
}

export default function CampaignsPage() {
  const t = useTranslations()
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  const [pagination, setPagination] = useState({ page: 1, perPage: 20, total: 0, totalPages: 0 })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [campaignResult, summaryResult] = await Promise.all([
        getCampaigns({
          status: status === "all" ? undefined : status,
          type: type === "all" ? undefined : type,
          search: search || undefined,
          page: pagination.page,
          perPage: pagination.perPage,
        }),
        getCampaignSummary(),
      ])
      setCampaigns(campaignResult.campaigns as unknown as CampaignItem[])
      setPagination(campaignResult.pagination)
      setSummary(summaryResult as unknown as Summary)
    } catch {
      toast.error("Failed to load campaigns")
    } finally {
      setIsLoading(false)
    }
  }, [status, type, search, pagination.page, pagination.perPage])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    try {
      await deleteCampaign(id)
      toast.success("Campaign deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete campaign")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateCampaign(id)
      toast.success("Campaign duplicated")
      fetchData()
    } catch {
      toast.error("Failed to duplicate campaign")
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateCampaign({ id, status: newStatus as "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED" })
      toast.success(`Campaign ${newStatus.toLowerCase()}`)
      fetchData()
    } catch {
      toast.error("Failed to update campaign")
    }
  }

  const formatCurrency = (value: number | string | null) => {
    const num = Number(value ?? 0)
    return num.toLocaleString("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 })
  }

  const getBudgetPercent = (spent: number | string, budget: number | string | null) => {
    const b = Number(budget ?? 0)
    const s = Number(spent)
    return b > 0 ? Math.min(Math.round((s / b) * 100), 100) : 0
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.campaigns.title} description={t.campaigns.subtitle}>
        <Button asChild>
          <Link href="/campaigns/create"><Plus className="mr-2 h-4 w-4" />New Campaign</Link>
        </Button>
      </PageHeader>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Campaigns" value={summary.total.toString()} icon={Megaphone} description="all campaigns" />
          <StatCard title="Active" value={summary.active.toString()} icon={Target} change={summary.active > 0 ? `${summary.active} running` : undefined} changeType="positive" description="currently active" />
          <StatCard title={t.campaigns.budget} value={formatCurrency(summary.totalBudget)} icon={DollarSign} description="allocated budget" />
          <StatCard title={t.campaigns.spent} value={formatCurrency(summary.totalSpent)} icon={BarChart3} description={`${summary.totalBudget > 0 ? Math.round((summary.totalSpent / summary.totalBudget) * 100) : 0}% of budget`} />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BRAND_AWARENESS">Brand Awareness</SelectItem>
                <SelectItem value="LEAD_GENERATION">Lead Generation</SelectItem>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                <SelectItem value="PRODUCT_LAUNCH">Product Launch</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[160px]" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No campaigns yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first marketing campaign to organize content, track goals, and measure performance across channels.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/campaigns/create"><Plus className="mr-2 h-4 w-4" />Create Campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const statusConfig = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.DRAFT
            const budgetPct = getBudgetPercent(campaign.spentAmount, campaign.budget)

            return (
              <Card key={campaign.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <Link href={`/campaigns/${campaign.id}`} className="text-lg font-semibold hover:underline">
                          {campaign.name}
                        </Link>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[campaign.type] ?? campaign.type}
                        </Badge>
                      </div>

                      {campaign.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{campaign.description}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {campaign.channels.slice(0, 4).map((ch) => {
                            const Icon = PLATFORM_ICONS[ch] ?? Globe
                            return <Icon key={ch} className="h-3.5 w-3.5" />
                          })}
                          {campaign.channels.length > 4 && <span>+{campaign.channels.length - 4}</span>}
                        </div>

                        {campaign.startDate && (
                          <span>
                            {new Date(campaign.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {campaign._count.content} content
                        </span>

                        {campaign.goalTarget && campaign.goalTarget > 0 && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {campaign.goalCurrent}/{campaign.goalTarget} {campaign.goalType}
                          </span>
                        )}
                      </div>

                      {campaign.budget != null && Number(campaign.budget) > 0 ? (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${budgetPct >= 90 ? "bg-red-500" : budgetPct >= 70 ? "bg-yellow-500" : "bg-primary"}`}
                              style={{ width: `${budgetPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(campaign.spentAmount)} / {formatCurrency(campaign.budget)} ({budgetPct}%)
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}`}><Eye className="mr-2 h-4 w-4" />View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                          <Copy className="mr-2 h-4 w-4" />Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "ACTIVE")}>
                            <Play className="mr-2 h-4 w-4" />Activate
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "PAUSED")}>
                            <Pause className="mr-2 h-4 w-4" />Pause
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "PAUSED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "ACTIVE")}>
                            <Play className="mr-2 h-4 w-4" />Resume
                          </DropdownMenuItem>
                        )}
                        {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "COMPLETED")}>
                            <CheckCircle className="mr-2 h-4 w-4" />Complete
                          </DropdownMenuItem>
                        )}
                        {campaign.status !== "ARCHIVED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "ARCHIVED")}>
                            <Archive className="mr-2 h-4 w-4" />Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(campaign.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(pagination.page - 1) * pagination.perPage + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
