"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
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
  MoreHorizontal,
  UserCheck,
  UserX,
  AlertTriangle,
  Trash2,
  Ban,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import {
  getSubscribers,
  getEmailStats,
  addSubscriber,
  unsubscribe,
  deleteSubscriber,
} from "@/server/actions/email"

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "UNSUBSCRIBED", label: "Unsubscribed" },
  { value: "BOUNCED", label: "Bounced" },
]

interface Subscriber {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  subscribedAt: string
  unsubscribedAt: string | null
  tags: { id: string; name: string }[]
}

interface Stats {
  totalSubscribers: number
  activeSubscribers: number
  bouncedSubscribers: number
  totalCampaigns: number
  sent: number
  scheduled: number
  avgOpenRate: number
  avgClickRate: number
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  UNSUBSCRIBED: { label: "Unsubscribed", variant: "secondary" },
  BOUNCED: { label: "Bounced", variant: "destructive" },
}

export default function SubscribersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSub, setNewSub] = useState({ email: "", firstName: "", lastName: "" })

  const fetchData = useCallback(async () => {
    try {
      const [statsData, subsData] = await Promise.all([
        getEmailStats(),
        getSubscribers({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          perPage: 20,
        }),
      ])
      setStats(statsData)
      setSubscribers(subsData.subscribers as unknown as Subscriber[])
      setTotalPages(subsData.pagination.totalPages)
    } catch {
      toast.error("Failed to load subscriber data")
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = async () => {
    if (!newSub.email.trim()) {
      toast.error("Email is required")
      return
    }
    try {
      await addSubscriber({
        email: newSub.email.trim(),
        firstName: newSub.firstName.trim() || undefined,
        lastName: newSub.lastName.trim() || undefined,
      })
      toast.success("Subscriber added")
      setShowAddDialog(false)
      setNewSub({ email: "", firstName: "", lastName: "" })
      fetchData()
    } catch {
      toast.error("Failed to add subscriber")
    }
  }

  const handleUnsubscribe = async (id: string) => {
    try {
      await unsubscribe(id)
      toast.success("Subscriber unsubscribed")
      fetchData()
    } catch {
      toast.error("Failed to unsubscribe")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscriber(id)
      toast.success("Subscriber deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete subscriber")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Subscribers" description="Manage your email subscriber lists">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Subscriber</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subscriber</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={newSub.email} onChange={(e) => setNewSub((p) => ({ ...p, email: e.target.value }))} placeholder="subscriber@example.com" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={newSub.firstName} onChange={(e) => setNewSub((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={newSub.lastName} onChange={(e) => setNewSub((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full">Add Subscriber</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Subscribers" value={String(stats.totalSubscribers)} icon={Users} />
          <StatCard title="Active" value={String(stats.activeSubscribers)} icon={UserCheck} changeType="positive" change="receiving emails" />
          <StatCard title="Bounced" value={String(stats.bouncedSubscribers)} icon={AlertTriangle} changeType={stats.bouncedSubscribers > 0 ? "negative" : "neutral"} />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by email, name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
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

      {subscribers.length === 0 ? (
        <EmptyState icon={Users} title="No subscribers" description="Add subscribers to start sending email campaigns">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Subscriber
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {subscribers.map((sub) => {
            const cfg = statusConfig[sub.status] ?? { label: sub.status, variant: "outline" as const }
            return (
              <Card key={sub.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{sub.email}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {(sub.firstName || sub.lastName) && (
                            <span>{sub.firstName ?? ""} {sub.lastName ?? ""}</span>
                          )}
                          <span>Subscribed {new Date(sub.subscribedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {sub.tags.length > 0 && (
                        <div className="flex gap-1">
                          {sub.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">{tag.name}</Badge>
                          ))}
                          {sub.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{sub.tags.length - 2}</Badge>
                          )}
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {sub.status === "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleUnsubscribe(sub.id)}>
                              <Ban className="mr-2 h-3.5 w-3.5" />Unsubscribe
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(sub.id)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
