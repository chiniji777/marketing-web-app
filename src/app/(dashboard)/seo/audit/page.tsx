"use client"

import { useState, useEffect, useCallback } from "react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileSearch,
  Plus,
  MoreHorizontal,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { getSeoAudits, runSeoAudit, deleteSeoAudit } from "@/server/actions/seo"

interface AuditIssues {
  critical: number
  warnings: number
  notices: number
  passed: number
}

interface AuditResults {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  [key: string]: unknown
}

interface SeoAudit {
  id: string
  url: string
  score: number | null
  issues: AuditIssues | null
  results: AuditResults | null
  createdAt: string
}

export default function SiteAuditPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [audits, setAudits] = useState<SeoAudit[]>([])
  const [showRunDialog, setShowRunDialog] = useState(false)
  const [url, setUrl] = useState("")
  const [selectedAudit, setSelectedAudit] = useState<SeoAudit | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getSeoAudits()
      setAudits(data as unknown as SeoAudit[])
    } catch {
      toast.error("Failed to load audits")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRunAudit = async () => {
    if (!url.trim()) {
      toast.error("URL is required")
      return
    }
    setIsRunning(true)
    try {
      await runSeoAudit({ url: url.trim() })
      toast.success("Audit completed")
      setShowRunDialog(false)
      setUrl("")
      fetchData()
    } catch {
      toast.error("Failed to run audit")
    } finally {
      setIsRunning(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSeoAudit(id)
      toast.success("Audit deleted")
      if (selectedAudit?.id === id) setSelectedAudit(null)
      fetchData()
    } catch {
      toast.error("Failed to delete audit")
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "default" as const
    if (score >= 70) return "secondary" as const
    return "destructive" as const
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Site Audit" description="Analyze your website for SEO issues and opportunities" backHref="/seo">
        <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Run Audit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run SEO Audit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Website URL *</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourwebsite.com" />
              </div>
              <Button onClick={handleRunAudit} disabled={isRunning} className="w-full">
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                {isRunning ? "Analyzing..." : "Run Audit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Audit Detail */}
      {selectedAudit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{selectedAudit.url}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Audited on {new Date(selectedAudit.createdAt).toLocaleString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAudit(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {selectedAudit.results && (
                <>
                  {(["performance", "accessibility", "bestPractices", "seo"] as const).map((key) => {
                    const val = (selectedAudit.results as AuditResults)[key]
                    const num = typeof val === "number" ? val : 0
                    return (
                      <div key={key} className="rounded-lg border p-4 text-center">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{key === "bestPractices" ? "Best Practices" : key}</p>
                        <p className={`mt-2 text-3xl font-bold ${getScoreColor(num)}`}>{num}</p>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
            {selectedAudit.issues && (
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedAudit.issues.critical}</p>
                    <p className="text-xs text-muted-foreground">Critical</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedAudit.issues.warnings}</p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedAudit.issues.notices}</p>
                    <p className="text-xs text-muted-foreground">Notices</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">{selectedAudit.issues.passed}</p>
                    <p className="text-xs text-muted-foreground">Passed</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {audits.length === 0 ? (
        <EmptyState icon={FileSearch} title="No audits yet" description="Run an SEO audit to find improvement opportunities">
          <Button onClick={() => setShowRunDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Run Audit
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => (
            <Card key={audit.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedAudit(audit)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{audit.url}</p>
                    <p className="text-sm text-muted-foreground">{new Date(audit.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {audit.score !== null && (
                      <Badge variant={getScoreBadge(audit.score)} className="text-sm">{audit.score}/100</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(audit.id) }}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
