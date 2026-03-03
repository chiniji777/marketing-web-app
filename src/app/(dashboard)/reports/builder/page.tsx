"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Target,
  Mail,
  Search,
  Megaphone,
  Plus,
  Save,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createReport } from "@/server/actions/report"

const WIDGET_TEMPLATES = [
  { id: "campaigns", label: "Campaign Metrics", icon: Megaphone, type: "CAMPAIGN" as const, description: "Track campaign performance and ROI" },
  { id: "leads", label: "Lead Analytics", icon: Target, type: "LEADS" as const, description: "Lead pipeline and conversion data" },
  { id: "email", label: "Email Metrics", icon: Mail, type: "EMAIL" as const, description: "Open rates, clicks, and deliverability" },
  { id: "seo", label: "SEO Overview", icon: Search, type: "SEO" as const, description: "Keyword rankings and audit scores" },
  { id: "ads", label: "Ads Performance", icon: TrendingUp, type: "ADS" as const, description: "Ad spend, impressions, and conversions" },
  { id: "social", label: "Social Media", icon: Users, type: "SOCIAL" as const, description: "Social engagement and sentiment" },
]

const DATE_RANGES = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
]

export default function ReportBuilderPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [dateRange, setDateRange] = useState("30d")
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([])

  const toggleWidget = (id: string) => {
    setSelectedWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Report name is required")
      return
    }
    if (selectedWidgets.length === 0) {
      toast.error("Select at least one widget")
      return
    }

    setIsSaving(true)
    try {
      // Create a report for each selected widget type
      const primaryWidget = WIDGET_TEMPLATES.find((w) => w.id === selectedWidgets[0])
      await createReport({
        name: name.trim(),
        type: primaryWidget?.type ?? "CUSTOM",
        dateRange,
        description: description.trim() || undefined,
      })
      toast.success("Report created successfully")
      router.push("/reports")
    } catch {
      toast.error("Failed to create report")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Report Builder" description="Build custom reports with widgets" backHref="/reports">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Generate Report
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Report Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Q1 Marketing Report"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the report..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Widget Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {WIDGET_TEMPLATES.map((widget) => {
                  const Icon = widget.icon
                  const isSelected = selectedWidgets.includes(widget.id)
                  return (
                    <button
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{widget.label}</p>
                        <p className="text-xs text-muted-foreground">{widget.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {selectedWidgets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview ({selectedWidgets.length} widget{selectedWidgets.length > 1 ? "s" : ""})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedWidgets.map((wId) => {
                    const widget = WIDGET_TEMPLATES.find((w) => w.id === wId)
                    if (!widget) return null
                    const Icon = widget.icon
                    return (
                      <div key={wId} className="rounded-lg border border-dashed p-6 text-center">
                        <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">{widget.label}</p>
                        <p className="text-xs text-muted-foreground">Data will be generated from {dateRange} range</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
