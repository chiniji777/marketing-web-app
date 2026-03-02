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
  Loader2,
  Target,
  DollarSign,
  Users,
  Palette,
} from "lucide-react"
import { toast } from "sonner"
import { createAdsCampaign } from "@/server/actions/ads"

const PLATFORMS = [
  { value: "FACEBOOK", label: "Facebook", description: "Reach billions on Facebook" },
  { value: "INSTAGRAM", label: "Instagram", description: "Visual ads on Instagram" },
  { value: "TIKTOK", label: "TikTok Ads", description: "Engage younger audiences with video" },
  { value: "LINKEDIN", label: "LinkedIn Ads", description: "Target professionals & B2B" },
  { value: "TWITTER", label: "Twitter/X Ads", description: "Real-time engagement & trends" },
  { value: "YOUTUBE", label: "YouTube Ads", description: "Video ads on YouTube" },
]

const OBJECTIVES = [
  { value: "AWARENESS", label: "Brand Awareness", description: "Increase brand visibility" },
  { value: "TRAFFIC", label: "Website Traffic", description: "Drive visitors to your site" },
  { value: "ENGAGEMENT", label: "Engagement", description: "Boost likes, comments & shares" },
  { value: "LEADS", label: "Lead Generation", description: "Capture potential customers" },
  { value: "CONVERSIONS", label: "Conversions", description: "Drive specific actions" },
  { value: "SALES", label: "Sales", description: "Drive product purchases" },
]

type Platform = "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "LINKEDIN" | "TWITTER" | "YOUTUBE" | "PINTEREST"
type Objective = string

export default function CreateAdPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState("")
  const [platform, setPlatform] = useState<Platform | "">("")
  const [objective, setObjective] = useState<Objective | "">("")
  const [dailyBudget, setDailyBudget] = useState("")
  const [totalBudget, setTotalBudget] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [adContent, setAdContent] = useState("")

  const canNext = () => {
    if (step === 1) return name.trim() && platform && objective
    if (step === 2) return true
    if (step === 3) return true
    return true
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      await createAdsCampaign({
        name: name.trim(),
        platform: platform as Platform,
        objective: objective as Objective,
        dailyBudget: dailyBudget ? parseFloat(dailyBudget) : undefined,
        totalBudget: totalBudget ? parseFloat(totalBudget) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        targetAudience: targetAudience.trim() || undefined,
        adContent: adContent.trim() || undefined,
      })
      toast.success("Ad campaign created")
      router.push("/ads")
    } catch {
      toast.error("Failed to create campaign")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ads"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader heading="Create Ad Campaign" description="Set up a new ad campaign" />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: "Campaign", icon: Target },
          { num: 2, label: "Budget", icon: DollarSign },
          { num: 3, label: "Audience", icon: Users },
          { num: 4, label: "Review", icon: Check },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.num} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${step > i ? "bg-primary" : "bg-border"}`} />}
              <button
                onClick={() => step > s.num && setStep(s.num)}
                disabled={step < s.num}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  step === s.num ? "bg-primary text-primary-foreground" : step > s.num ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />{s.label}
              </button>
            </div>
          )
        })}
      </div>

      {/* Step 1: Campaign Basics */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Campaign Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Summer Sale 2026" />
            </div>
            <div className="space-y-2">
              <Label>Platform *</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {PLATFORMS.map((p) => (
                  <button key={p.value} onClick={() => setPlatform(p.value as Platform)} className={`rounded-lg border p-3 text-left transition-colors ${platform === p.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objective *</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {OBJECTIVES.map((o) => (
                  <button key={o.value} onClick={() => setObjective(o.value as Objective)} className={`rounded-lg border p-3 text-left transition-colors ${objective === o.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <p className="text-sm font-medium">{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Budget */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Budget & Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Daily Budget (฿)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                  <Input type="number" min={0} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} className="pl-9" placeholder="50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Total Budget (฿)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                  <Input type="number" min={0} value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="pl-9" placeholder="1000" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Audience & Content */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Audience & Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} rows={3} placeholder="Describe your target audience (demographics, interests, behaviors)" />
            </div>
            <div className="space-y-2">
              <Label>Ad Content / Copy</Label>
              <Textarea value={adContent} onChange={(e) => setAdContent(e.target.value)} rows={4} placeholder="Write your ad copy or describe what you want to promote" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Review Campaign</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Name</p><p className="text-sm font-medium">{name}</p></div>
                <div><p className="text-xs text-muted-foreground">Platform</p><p className="text-sm font-medium">{PLATFORMS.find((p) => p.value === platform)?.label}</p></div>
                <div><p className="text-xs text-muted-foreground">Objective</p><p className="text-sm font-medium">{OBJECTIVES.find((o) => o.value === objective)?.label}</p></div>
                {dailyBudget && <div><p className="text-xs text-muted-foreground">Daily Budget</p><p className="text-sm font-medium">฿{dailyBudget}</p></div>}
                {totalBudget && <div><p className="text-xs text-muted-foreground">Total Budget</p><p className="text-sm font-medium">฿{totalBudget}</p></div>}
                {startDate && <div><p className="text-xs text-muted-foreground">Start</p><p className="text-sm font-medium">{startDate}</p></div>}
                {endDate && <div><p className="text-xs text-muted-foreground">End</p><p className="text-sm font-medium">{endDate}</p></div>}
              </div>
              {targetAudience && (
                <div><p className="text-xs text-muted-foreground">Target Audience</p><p className="text-sm">{targetAudience}</p></div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Next<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Create Campaign
          </Button>
        )}
      </div>
    </div>
  )
}
