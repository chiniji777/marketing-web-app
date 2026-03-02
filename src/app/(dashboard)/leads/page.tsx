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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  DollarSign,
  UserCheck,
  Target,
  Trash2,
  ArrowRight,
  Phone,
  Mail,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import {
  getLeads,
  getLeadsByPipeline,
  getLeadStats,
  createLead,
  updateLead,
  deleteLead,
} from "@/server/actions/lead"
import { useTranslations } from "@/hooks/use-locale"

const PIPELINE_STAGES = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualified", color: "bg-purple-500" },
  { value: "proposal", label: "Proposal", color: "bg-indigo-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { value: "won", label: "Won", color: "bg-emerald-500" },
  { value: "lost", label: "Lost", color: "bg-red-500" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
]

const SOURCE_OPTIONS = [
  "WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "EMAIL", "COLD_CALL", "EVENT", "OTHER",
]

interface Lead {
  id: string
  status: string
  pipelineStage: string
  source: string | null
  score: number
  estimatedValue: unknown
  lastActivityAt: string | null
  createdAt: string
  contact: {
    id: string
    firstName: string
    lastName: string | null
    email: string | null
    phone: string | null
    company: string | null
  }
  assignedTo: { id: string; name: string | null; image: string | null } | null
  _count?: { activities: number }
}

interface PipelineStage {
  stage: string
  leads: Lead[]
}

interface Stats {
  total: number
  newLeads: number
  qualified: number
  won: number
  lost: number
  pipelineValue: number
  conversionRate: number
}

export default function LeadsPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [stats, setStats] = useState<Stats | null>(null)
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([])
  const [listLeads, setListLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newLead, setNewLead] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    source: "WEBSITE",
    estimatedValue: "",
  })

  const fetchData = useCallback(async () => {
    try {
      const [statsData, pipeData] = await Promise.all([
        getLeadStats(),
        getLeadsByPipeline(),
      ])
      setStats(statsData)
      setPipelineData(pipeData as unknown as PipelineStage[])
    } catch {
      toast.error("Failed to load leads data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchListData = useCallback(async () => {
    try {
      const result = await getLeads({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        perPage: 20,
      })
      setListLeads(result.leads as unknown as Lead[])
      setTotalPages(result.pagination.totalPages)
    } catch {
      toast.error("Failed to load leads")
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (viewMode === "list") fetchListData()
  }, [viewMode, fetchListData])

  const handleCreateLead = async () => {
    if (!newLead.firstName.trim()) {
      toast.error("First name is required")
      return
    }
    try {
      await createLead({
        firstName: newLead.firstName.trim(),
        pipelineStage: "NEW",
        lastName: newLead.lastName.trim() || undefined,
        email: newLead.email.trim() || undefined,
        phone: newLead.phone.trim() || undefined,
        company: newLead.company.trim() || undefined,
        source: newLead.source,
        estimatedValue: newLead.estimatedValue ? parseFloat(newLead.estimatedValue) : undefined,
      })
      toast.success("Lead created")
      setShowAddDialog(false)
      setNewLead({ firstName: "", lastName: "", email: "", phone: "", company: "", source: "WEBSITE", estimatedValue: "" })
      fetchData()
      if (viewMode === "list") fetchListData()
    } catch {
      toast.error("Failed to create lead")
    }
  }

  const handleMoveStage = async (leadId: string, newStage: string) => {
    try {
      await updateLead({ id: leadId, pipelineStage: newStage })
      toast.success(`Moved to ${newStage}`)
      fetchData()
    } catch {
      toast.error("Failed to move lead")
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId)
      toast.success("Lead deleted")
      fetchData()
      if (viewMode === "list") fetchListData()
    } catch {
      toast.error("Failed to delete lead")
    }
  }

  const getStageLabel = (stage: string) =>
    PIPELINE_STAGES.find((s) => s.value === stage)?.label ?? stage

  const getStageColor = (stage: string) =>
    PIPELINE_STAGES.find((s) => s.value === stage)?.color ?? "bg-gray-500"

  const getInitials = (first: string, last: string | null) =>
    `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase()

  const formatValue = (val: unknown) => {
    const num = Number(val)
    if (!num) return "-"
    return `฿${num.toLocaleString()}`
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
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.leads.title} description={t.leads.subtitle}>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/leads/forms">Lead Forms</Link>
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input value={newLead.firstName} onChange={(e) => setNewLead((p) => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={newLead.lastName} onChange={(e) => setNewLead((p) => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newLead.email} onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newLead.phone} onChange={(e) => setNewLead((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={newLead.company} onChange={(e) => setNewLead((p) => ({ ...p, company: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={newLead.source} onValueChange={(v) => setNewLead((p) => ({ ...p, source: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Value (฿)</Label>
                    <Input type="number" min={0} value={newLead.estimatedValue} onChange={(e) => setNewLead((p) => ({ ...p, estimatedValue: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleCreateLead} className="w-full">Create Lead</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t.leads.totalLeads} value={String(stats.total)} icon={Users} change={`${stats.newLeads} ${t.dashboard.thisMonth}`} changeType="positive" />
          <StatCard title={t.leads.pipelineValue} value={`฿${stats.pipelineValue.toLocaleString()}`} icon={DollarSign} description={t.common.active.toLowerCase()} />
          <StatCard title={t.leads.qualified} value={String(stats.qualified)} icon={UserCheck} description={t.leads.readyForOutreach} />
          <StatCard title={t.leads.conversionRate} value={`${stats.conversionRate}%`} icon={Target} change={`${stats.won} ${t.leads.won.toLowerCase()}`} changeType="positive" />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>
                <LayoutGrid className="mr-2 h-4 w-4" />Kanban
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                <List className="mr-2 h-4 w-4" />List
              </Button>
            </div>
            {viewMode === "list" && (
              <div className="flex flex-1 items-center gap-2 sm:max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search leads..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineData.map(({ stage, leads }) => {
            const stageInfo = PIPELINE_STAGES.find((s) => s.value === stage)
            return (
              <div key={stage} className="flex w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${stageInfo?.color ?? "bg-gray-500"}`} />
                    <span className="text-sm font-medium">{stageInfo?.label ?? stage}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2">
                  {leads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-muted-foreground">No leads</p>
                    </div>
                  )}
                  {leads.map((lead) => (
                    <Card key={lead.id} className="cursor-pointer transition-shadow hover:shadow-md">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(lead.contact.firstName, lead.contact.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {lead.contact.firstName} {lead.contact.lastName ?? ""}
                              </p>
                              {lead.contact.company && (
                                <p className="text-xs text-muted-foreground">{lead.contact.company}</p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {PIPELINE_STAGES.filter((s) => s.value !== stage).map((s) => (
                                <DropdownMenuItem key={s.value} onClick={() => handleMoveStage(lead.id, s.value)}>
                                  <ArrowRight className="mr-2 h-3.5 w-3.5" />Move to {s.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteLead(lead.id)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          {lead.estimatedValue != null && Number(lead.estimatedValue) > 0 ? (
                            <span className="font-medium text-emerald-600">{formatValue(lead.estimatedValue)}</span>
                          ) : null}
                          {lead.score > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Score: {lead.score}</Badge>
                          )}
                        </div>
                        {lead.contact.email && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />{lead.contact.email}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === "list" && (
        <>
          {listLeads.length === 0 ? (
            <EmptyState icon={Users} title="No leads found" description="Try adjusting your filters or add a new lead">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />Add Lead
              </Button>
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {listLeads.map((lead) => (
                <Card key={lead.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(lead.contact.firstName, lead.contact.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.contact.firstName} {lead.contact.lastName ?? ""}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {lead.contact.email && (
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.contact.email}</span>
                            )}
                            {lead.contact.phone && (
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.contact.phone}</span>
                            )}
                            {lead.contact.company && (
                              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.contact.company}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <div className={`mr-1.5 h-2 w-2 rounded-full ${getStageColor(lead.pipelineStage)}`} />
                              {getStageLabel(lead.pipelineStage)}
                            </Badge>
                            {lead.estimatedValue != null && Number(lead.estimatedValue) > 0 ? (
                              <span className="text-sm font-medium text-emerald-600">{formatValue(lead.estimatedValue)}</span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lead.source?.replace(/_/g, " ") ?? "Unknown source"} · Score: {lead.score}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {PIPELINE_STAGES.filter((s) => s.value !== lead.pipelineStage).map((s) => (
                              <DropdownMenuItem key={s.value} onClick={() => handleMoveStage(lead.id, s.value)}>
                                <ArrowRight className="mr-2 h-3.5 w-3.5" />Move to {s.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteLead(lead.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
