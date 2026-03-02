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
  Mail,
  Plus,
  Search,
  MoreHorizontal,
  Send,
  Users,
  MousePointerClick,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  Pause,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import {
  getEmailCampaigns,
  getEmailStats,
  updateEmailCampaign,
  deleteEmailCampaign,
} from "@/server/actions/email"

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "SENDING", label: "Sending" },
  { value: "SENT", label: "Sent" },
  { value: "PAUSED", label: "Paused" },
]

interface EmailCampaign {
  id: string
  name: string
  subject: string
  status: string
  senderName: string | null
  senderEmail: string | null
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  totalUnsubscribed: number
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  template: { id: string; name: string } | null
}

interface Stats {
  totalCampaigns: number
  sent: number
  scheduled: number
  totalSubscribers: number
  activeSubscribers: number
  bouncedSubscribers: number
  avgOpenRate: number
  avgClickRate: number
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SCHEDULED: { label: "Scheduled", variant: "outline" },
  SENDING: { label: "Sending", variant: "default" },
  SENT: { label: "Sent", variant: "default" },
  PAUSED: { label: "Paused", variant: "secondary" },
}

export default function EmailPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    try {
      const [statsData, campaignsData] = await Promise.all([
        getEmailStats(),
        getEmailCampaigns({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          perPage: 20,
        }),
      ])
      setStats(statsData)
      setCampaigns(campaignsData.campaigns as unknown as EmailCampaign[])
      setTotalPages(campaignsData.pagination.totalPages)
    } catch {
      toast.error("Failed to load email data")
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusChange = async (id: string, newStatus: "DRAFT" | "SCHEDULED" | "PAUSED" | "SENDING" | "SENT" | "CANCELLED") => {
    try {
      await updateEmailCampaign({ id, status: newStatus })
      toast.success(`Campaign ${newStatus.toLowerCase()}`)
      fetchData()
    } catch {
      toast.error("Failed to update campaign")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEmailCampaign(id)
      toast.success("Campaign deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete campaign")
    }
  }

  const formatRate = (sent: number, metric: number) => {
    if (sent === 0) return "0%"
    return `${Math.round((metric / sent) * 100)}%`
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
      <PageHeader heading={t.emailMarketing.title} description={t.emailMarketing.subtitle}>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/email/templates">Templates</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/email/subscribers">Subscribers</Link>
          </Button>
          <Button asChild>
            <Link href="/email/compose"><Plus className="mr-2 h-4 w-4" />New Campaign</Link>
          </Button>
        </div>
      </PageHeader>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t.emailMarketing.totalCampaigns} value={String(stats.totalCampaigns)} icon={Mail} change={`${stats.sent} ${t.emailMarketing.sent.toLowerCase()}`} changeType="positive" />
          <StatCard title={t.emailMarketing.totalSubscribers} value={String(stats.totalSubscribers)} icon={Users} change={`${stats.activeSubscribers} active`} changeType="positive" />
          <StatCard title={t.emailMarketing.avgOpenRate} value={`${stats.avgOpenRate}%`} icon={Eye} description="across all campaigns" />
          <StatCard title={t.emailMarketing.avgClickRate} value={`${stats.avgClickRate}%`} icon={MousePointerClick} description="across all campaigns" />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
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
        <EmptyState icon={Mail} title="No email campaigns" description="Create your first email campaign to engage your audience">
          <Button asChild>
            <Link href="/email/compose"><Plus className="mr-2 h-4 w-4" />Create Campaign</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const cfg = statusConfig[campaign.status] ?? { label: campaign.status, variant: "outline" as const }
            return (
              <Card key={campaign.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{campaign.name}</h3>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{campaign.subject}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {campaign.status === "SENT" && campaign.totalSent > 0 && (
                          <>
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />{campaign.totalSent.toLocaleString()} sent
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />{formatRate(campaign.totalSent, campaign.totalOpened)} opened
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" />{formatRate(campaign.totalSent, campaign.totalClicked)} clicked
                            </span>
                          </>
                        )}
                        {campaign.status === "SCHEDULED" && campaign.scheduledAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                          </span>
                        )}
                        {campaign.template && (
                          <span>Template: {campaign.template.name}</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {campaign.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "SCHEDULED")}>
                            <Clock className="mr-2 h-3.5 w-3.5" />Schedule
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "SCHEDULED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "DRAFT")}>
                            <Pause className="mr-2 h-3.5 w-3.5" />Unschedule
                          </DropdownMenuItem>
                        )}
                        {campaign.status === "PAUSED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "SENDING")}>
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
