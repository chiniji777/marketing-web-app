"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Zap,
  Plus,
  ArrowRight,
  Mail,
  Clock,
  UserPlus,
  ShoppingCart,
  MousePointerClick,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import {
  getEmailCampaigns,
  createEmailCampaign,
  updateEmailCampaign,
  deleteEmailCampaign,
} from "@/server/actions/email"

const AUTOMATION_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Series",
    description: "Send a series of welcome emails to new subscribers",
    trigger: "new_subscriber",
    triggerLabel: "New Subscriber",
    icon: UserPlus,
    steps: 3,
    subject: "Welcome to {{company}}!",
    htmlContent: "<h1>Welcome!</h1><p>Thank you for subscribing. We're excited to have you on board.</p>",
  },
  {
    id: "abandoned-cart",
    name: "Abandoned Cart",
    description: "Remind customers about items left in their cart",
    trigger: "cart_abandoned",
    triggerLabel: "Cart Abandoned",
    icon: ShoppingCart,
    steps: 2,
    subject: "You left something behind!",
    htmlContent: "<h1>Don't forget!</h1><p>You have items waiting in your cart. Complete your purchase today.</p>",
  },
  {
    id: "re-engagement",
    name: "Re-engagement",
    description: "Win back inactive subscribers with special offers",
    trigger: "inactive_30d",
    triggerLabel: "Inactive 30 Days",
    icon: MousePointerClick,
    steps: 3,
    subject: "We miss you!",
    htmlContent: "<h1>We miss you!</h1><p>It's been a while since we've heard from you. Here's a special offer to welcome you back.</p>",
  },
  {
    id: "drip",
    name: "Custom Drip Campaign",
    description: "Create a time-based email sequence for nurturing leads",
    trigger: "custom",
    triggerLabel: "Custom Trigger",
    icon: Clock,
    steps: 0,
    subject: "",
    htmlContent: "",
  },
]

const TRIGGER_LABELS: Record<string, string> = {
  new_subscriber: "New Subscriber",
  cart_abandoned: "Cart Abandoned",
  inactive_30d: "Inactive 30 Days",
  custom: "Custom Trigger",
}

interface Automation {
  id: string
  name: string
  subject: string
  status: string
  automationType: string | null
  automationConfig: {
    trigger?: string
    steps?: number
    delayMinutes?: number
    templateId?: string
  } | null
  totalSent: number
  totalOpened: number
  totalClicked: number
  createdAt: string
}

export default function AutomationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [automations, setAutomations] = useState<Automation[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [customName, setCustomName] = useState("")
  const [customSubject, setCustomSubject] = useState("")
  const [customContent, setCustomContent] = useState("")
  const [delayMinutes, setDelayMinutes] = useState("60")

  const fetchData = useCallback(async () => {
    try {
      const result = await getEmailCampaigns({ perPage: 100 })
      const filtered = (result.campaigns as unknown as Automation[]).filter(
        (c) => c.automationType != null
      )
      setAutomations(filtered)
    } catch {
      toast.error("Failed to load automations")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    if (template.id === "drip") {
      setSelectedTemplate(templateId)
      return
    }

    try {
      await createEmailCampaign({
        name: `${template.name} Automation`,
        subject: template.subject,
        htmlContent: template.htmlContent,
        automationType: template.trigger,
        automationConfig: JSON.stringify({
          trigger: template.trigger,
          steps: template.steps,
          delayMinutes: 60,
        }),
      })
      toast.success(`${template.name} automation created`)
      setShowCreateDialog(false)
      fetchData()
    } catch {
      toast.error("Failed to create automation")
    }
  }

  const handleCreateCustom = async () => {
    if (!customName.trim() || !customSubject.trim()) {
      toast.error("Name and subject are required")
      return
    }

    try {
      await createEmailCampaign({
        name: customName.trim(),
        subject: customSubject.trim(),
        htmlContent: customContent.trim() || "<p>Your email content here</p>",
        automationType: "custom",
        automationConfig: JSON.stringify({
          trigger: "custom",
          steps: 1,
          delayMinutes: parseInt(delayMinutes) || 60,
        }),
      })
      toast.success("Custom automation created")
      setShowCreateDialog(false)
      setSelectedTemplate("")
      setCustomName("")
      setCustomSubject("")
      setCustomContent("")
      fetchData()
    } catch {
      toast.error("Failed to create automation")
    }
  }

  const handleToggleStatus = async (automation: Automation) => {
    const newStatus = automation.status === "SCHEDULED" ? "PAUSED" : "SCHEDULED"
    try {
      await updateEmailCampaign({ id: automation.id, status: newStatus })
      toast.success(`Automation ${newStatus === "SCHEDULED" ? "activated" : "paused"}`)
      fetchData()
    } catch {
      toast.error("Failed to update automation")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEmailCampaign(id)
      toast.success("Automation deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete automation")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Automations" description="Set up automated email sequences and drip campaigns">
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) setSelectedTemplate("")
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Automation</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate === "drip" ? "Custom Drip Campaign" : "Create Automation"}
              </DialogTitle>
            </DialogHeader>

            {selectedTemplate === "drip" ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Automation Name *</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Lead Nurture Series"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Subject *</Label>
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g., Step {{step}} - Getting Started"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delay Between Emails</Label>
                  <Select value={delayMinutes} onValueChange={setDelayMinutes}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="1440">1 day</SelectItem>
                      <SelectItem value="4320">3 days</SelectItem>
                      <SelectItem value="10080">1 week</SelectItem>
                      <SelectItem value="20160">2 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email Content (HTML)</Label>
                  <Textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="<h1>Your email content</h1>"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedTemplate("")}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleCreateCustom}>
                    Create Automation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">Choose a template to get started</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {AUTOMATION_TEMPLATES.map((template) => {
                    const Icon = template.icon
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleCreateFromTemplate(template.id)}
                        className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">{template.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {template.triggerLabel}
                          </Badge>
                          {template.steps > 0 && <span>{template.steps} emails</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Template Cards */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Automation Templates</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {AUTOMATION_TEMPLATES.map((template) => {
            const Icon = template.icon
            return (
              <Card key={template.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{template.triggerLabel}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCreateDialog(true)
                        setTimeout(() => handleCreateFromTemplate(template.id), 100)
                      }}
                    >
                      Use <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Active Automations */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Active Automations ({automations.length})</h3>
        {automations.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No active automations"
            description="Create your first automation to start sending emails automatically"
          >
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />Create Automation
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => {
              const triggerLabel =
                automation.automationType != null
                  ? (TRIGGER_LABELS[automation.automationType] ?? automation.automationType)
                  : "Unknown"
              const isActive = automation.status === "SCHEDULED"
              const config = automation.automationConfig
              return (
                <Card key={automation.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isActive ? "bg-emerald-100" : "bg-muted"
                        }`}
                      >
                        <Zap
                          className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{automation.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{triggerLabel}</Badge>
                          {config?.steps != null && config.steps > 0 && (
                            <span>{config.steps} emails</span>
                          )}
                          <span>
                            {automation.totalSent} sent
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : automation.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleStatus(automation)}>
                            {isActive ? (
                              <><Pause className="mr-2 h-3.5 w-3.5" />Pause</>
                            ) : (
                              <><Play className="mr-2 h-3.5 w-3.5" />Activate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(automation.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
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
      </div>
    </div>
  )
}
