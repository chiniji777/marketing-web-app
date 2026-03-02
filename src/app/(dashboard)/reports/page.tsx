"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  BarChart3,
  Plus,
  MoreHorizontal,
  Trash2,
  FileText,
  Calendar,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import { getReports, createReport, deleteReport } from "@/server/actions/report"

const REPORT_TYPES = [
  { value: "CAMPAIGN", label: "Campaign Performance" },
  { value: "LEADS", label: "Lead Analytics" },
  { value: "EMAIL", label: "Email Metrics" },
  { value: "SEO", label: "SEO Overview" },
  { value: "ADS", label: "Ads Performance" },
  { value: "SOCIAL", label: "Social Media" },
  { value: "OVERVIEW", label: "Overview" },
  { value: "CUSTOM", label: "Custom Report" },
]

const DATE_RANGES = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
]

interface Report {
  id: string
  name: string
  description: string | null
  type: string
  dateRange: string
  isPublic: boolean
  data: unknown
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string | null } | null
}

export default function ReportsPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("CAMPAIGN_PERFORMANCE")
  const [newDateRange, setNewDateRange] = useState("30d")
  const [newDescription, setNewDescription] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const data = await getReports()
      setReports(data as unknown as Report[])
    } catch {
      toast.error("Failed to load reports")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Report name is required")
      return
    }
    try {
      await createReport({
        name: newName.trim(),
        type: newType as "CAMPAIGN" | "SOCIAL" | "ADS" | "EMAIL" | "SEO" | "LEADS" | "CUSTOM" | "OVERVIEW",
        dateRange: newDateRange,
        description: newDescription.trim() || undefined,
      })
      toast.success("Report generated")
      setShowCreateDialog(false)
      setNewName("")
      setNewDescription("")
      fetchData()
    } catch {
      toast.error("Failed to generate report")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id)
      toast.success("Report deleted")
      if (selectedReport?.id === id) setSelectedReport(null)
      fetchData()
    } catch {
      toast.error("Failed to delete report")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.reports.title} description={t.reports.subtitle}>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Report</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Report Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., March Performance Report" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={newDateRange} onValueChange={setNewDateRange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATE_RANGES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Optional description" />
              </div>
              <Button onClick={handleCreate} className="w-full">Generate Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Report Detail View */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedReport.name}</CardTitle>
                {selectedReport.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{selectedReport.description}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto max-h-[400px]">
              {JSON.stringify(selectedReport.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <EmptyState icon={BarChart3} title="No reports yet" description="Generate custom reports to track your marketing performance">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Create Report
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedReport(report)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{report.name}</CardTitle>
                    {report.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedReport(report) }}>
                        <Eye className="mr-2 h-3.5 w-3.5" />View
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(report.id) }}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{REPORT_TYPES.find((t) => t.value === report.type)?.label ?? report.type}</Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {DATE_RANGES.find((d) => d.value === report.dateRange)?.label ?? report.dateRange}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Generated {new Date(report.createdAt).toLocaleDateString()}
                  {report.createdBy?.name && ` by ${report.createdBy.name}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
