"use client"

import { useState, useEffect, useCallback, use } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Check,
  DollarSign,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Loader2,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { getCampaign, updateCampaign } from "@/server/actions/campaign"

const CHANNELS = [
  { value: "FACEBOOK", label: "Facebook", icon: Facebook },
  { value: "INSTAGRAM", label: "Instagram", icon: Instagram },
  { value: "TWITTER", label: "Twitter/X", icon: Twitter },
  { value: "LINKEDIN", label: "LinkedIn", icon: Linkedin },
  { value: "TIKTOK", label: "TikTok", icon: Globe },
  { value: "YOUTUBE", label: "YouTube", icon: Youtube },
  { value: "PINTEREST", label: "Pinterest", icon: Globe },
]

const GOAL_TYPES = [
  "Impressions", "Clicks", "Conversions", "Leads", "Sales Revenue",
  "Engagement Rate", "Followers", "Downloads", "Sign-ups",
]

type ChannelValue = "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "PINTEREST"
type CampaignTypeValue = "BRAND_AWARENESS" | "LEAD_GENERATION" | "SALES" | "ENGAGEMENT" | "PRODUCT_LAUNCH" | "EVENT" | "CUSTOM"
type StatusValue = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED"

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [campaignType, setCampaignType] = useState<CampaignTypeValue>("BRAND_AWARENESS")
  const [status, setStatus] = useState<StatusValue>("DRAFT")
  const [channels, setChannels] = useState<ChannelValue[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState("")
  const [goalType, setGoalType] = useState("")
  const [goalTarget, setGoalTarget] = useState("")

  const fetchCampaign = useCallback(async () => {
    try {
      const campaign = await getCampaign(id)
      setName(campaign.name)
      setDescription(campaign.description ?? "")
      setCampaignType(campaign.type as CampaignTypeValue)
      setStatus(campaign.status as StatusValue)
      setChannels(campaign.channels as ChannelValue[])
      setStartDate(campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : "")
      setEndDate(campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "")
      setBudget(campaign.budget ? String(Number(campaign.budget)) : "")
      setGoalType(campaign.goalType ?? "")
      setGoalTarget(campaign.goalTarget ? String(campaign.goalTarget) : "")
    } catch {
      toast.error("Failed to load campaign")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchCampaign() }, [fetchCampaign])

  const toggleChannel = (channel: ChannelValue) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Campaign name is required")
      return
    }
    if (channels.length === 0) {
      toast.error("Select at least one channel")
      return
    }

    setIsSaving(true)
    try {
      await updateCampaign({
        id,
        name: name.trim(),
        description: description.trim() || undefined,
        type: campaignType,
        status,
        channels,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        budget: budget ? parseFloat(budget) : null,
        goalType: goalType || null,
        goalTarget: goalTarget ? parseInt(goalTarget, 10) : null,
      })
      toast.success("Campaign updated")
      router.push(`/campaigns/${id}`)
    } catch {
      toast.error("Failed to update campaign")
    } finally {
      setIsSaving(false)
    }
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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/campaigns/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader heading="Edit Campaign" description={name} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={campaignType} onValueChange={(v) => setCampaignType(v as CampaignTypeValue)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as StatusValue)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Channels */}
          <Card>
            <CardHeader><CardTitle className="text-base">Channels</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon
                  const isSelected = channels.includes(ch.value as ChannelValue)
                  return (
                    <button
                      key={ch.value}
                      onClick={() => toggleChannel(ch.value as ChannelValue)}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{ch.label}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates & Budget */}
          <Card>
            <CardHeader><CardTitle className="text-base">Schedule & Budget</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (THB)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                  <Input id="budget" type="number" min={0} step={100} value={budget} onChange={(e) => setBudget(e.target.value)} className="pl-9" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader><CardTitle className="text-base">Goals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="goalTarget">Target</Label>
                <Input id="goalTarget" type="number" min={0} value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
