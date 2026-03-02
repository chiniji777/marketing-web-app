"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Megaphone,
  Target,
  DollarSign,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { createCampaign } from "@/server/actions/campaign"

const STEPS = [
  { id: "basics", label: "Basics", description: "Name and type" },
  { id: "channels", label: "Channels", description: "Select platforms" },
  { id: "goals", label: "Goals", description: "Objectives and budget" },
  { id: "review", label: "Review", description: "Confirm and create" },
]

const CAMPAIGN_TYPES = [
  { value: "BRAND_AWARENESS", label: "Brand Awareness", description: "Increase brand visibility and recognition", icon: Megaphone },
  { value: "LEAD_GENERATION", label: "Lead Generation", description: "Capture and nurture potential customers", icon: Target },
  { value: "SALES", label: "Sales", description: "Drive direct sales and conversions", icon: DollarSign },
  { value: "ENGAGEMENT", label: "Engagement", description: "Boost audience interaction and loyalty", icon: Globe },
  { value: "PRODUCT_LAUNCH", label: "Product Launch", description: "Launch new products or services", icon: Megaphone },
  { value: "EVENT", label: "Event", description: "Promote and manage events", icon: Target },
  { value: "CUSTOM", label: "Custom", description: "Custom campaign type", icon: Globe },
]

const CHANNELS = [
  { value: "FACEBOOK", label: "Facebook", icon: Facebook, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300" },
  { value: "TWITTER", label: "Twitter/X", icon: Twitter, color: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300" },
  { value: "LINKEDIN", label: "LinkedIn", icon: Linkedin, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "TIKTOK", label: "TikTok", icon: Globe, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "YOUTUBE", label: "YouTube", icon: Youtube, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  { value: "PINTEREST", label: "Pinterest", icon: Globe, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
]

const GOAL_TYPES = [
  "Impressions",
  "Clicks",
  "Conversions",
  "Leads",
  "Sales Revenue",
  "Engagement Rate",
  "Followers",
  "Downloads",
  "Sign-ups",
]

type ChannelValue = "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "PINTEREST"
type CampaignTypeValue = "BRAND_AWARENESS" | "LEAD_GENERATION" | "SALES" | "ENGAGEMENT" | "PRODUCT_LAUNCH" | "EVENT" | "CUSTOM"

export default function CreateCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [campaignType, setCampaignType] = useState<CampaignTypeValue | "">("")
  const [channels, setChannels] = useState<ChannelValue[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState("")
  const [goalType, setGoalType] = useState("")
  const [goalTarget, setGoalTarget] = useState("")

  const toggleChannel = (channel: ChannelValue) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    )
  }

  const canAdvance = () => {
    switch (step) {
      case 0: return name.trim().length > 0 && campaignType !== ""
      case 1: return channels.length > 0
      case 2: return true
      case 3: return true
      default: return false
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !campaignType || channels.length === 0) {
      toast.error("Please complete all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await createCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
        type: campaignType as CampaignTypeValue,
        channels,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        goalType: goalType || undefined,
        goalTarget: goalTarget ? parseInt(goalTarget, 10) : undefined,
      })
      toast.success("Campaign created successfully")
      router.push("/campaigns")
    } catch {
      toast.error("Failed to create campaign")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader heading="Create Campaign" description="Set up a new marketing campaign" />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => { if (i < step) setStep(i) }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium">
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].label}</CardTitle>
          <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the campaign goals and strategy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <Label>Campaign Type *</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {CAMPAIGN_TYPES.map((ct) => {
                    const Icon = ct.icon
                    const isSelected = campaignType === ct.value
                    return (
                      <button
                        key={ct.value}
                        onClick={() => setCampaignType(ct.value as CampaignTypeValue)}
                        className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ct.label}</p>
                          <p className="text-xs text-muted-foreground">{ct.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Channels */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select the platforms where this campaign will run.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon
                  const isSelected = channels.includes(ch.value as ChannelValue)
                  return (
                    <button
                      key={ch.value}
                      onClick={() => toggleChannel(ch.value as ChannelValue)}
                      className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : ch.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{ch.label}</p>
                      </div>
                      {isSelected && (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
              {channels.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  {channels.map((ch) => (
                    <Badge key={ch} variant="secondary" className="capitalize">
                      {ch.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Goals & Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (THB)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                  <Input
                    id="budget"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Goal Type</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger><SelectValue placeholder="Select a goal" /></SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalTarget">Goal Target</Label>
                  <Input
                    id="goalTarget"
                    type="number"
                    min={0}
                    placeholder="e.g., 10000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Campaign Name</p>
                  <p className="text-lg font-semibold">{name}</p>
                </div>
                {description && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Description</p>
                    <p className="text-sm">{description}</p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Type</p>
                    <Badge variant="outline" className="mt-1">
                      {CAMPAIGN_TYPES.find((t) => t.value === campaignType)?.label ?? campaignType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Channels</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {channels.map((ch) => {
                        const channelInfo = CHANNELS.find((c) => c.value === ch)
                        const Icon = channelInfo?.icon ?? Globe
                        return (
                          <Badge key={ch} variant="secondary" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {channelInfo?.label ?? ch}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {startDate && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Start Date</p>
                      <p className="text-sm">{new Date(startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {endDate && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">End Date</p>
                      <p className="text-sm">{new Date(endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {budget && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Budget</p>
                      <p className="text-sm">฿{parseFloat(budget).toLocaleString()}</p>
                    </div>
                  )}
                  {goalType && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Goal</p>
                      <p className="text-sm">{goalTarget ? `${parseInt(goalTarget, 10).toLocaleString()} ` : ""}{goalType}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />Previous
        </Button>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
              Next<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
