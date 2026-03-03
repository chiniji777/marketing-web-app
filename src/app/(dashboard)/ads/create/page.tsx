"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Loader2,
  Target,
  DollarSign,
  Users,
  Facebook,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { createAdsCampaign, createFacebookCampaign, getFacebookAdAccounts } from "@/server/actions/ads"
import { useAIAssist } from "@/hooks/use-ai-assist"

const PLATFORMS = [
  { value: "FACEBOOK", label: "Facebook", description: "โฆษณาบน Facebook ผ่าน API โดยตรง", hasFbApi: true },
  { value: "INSTAGRAM", label: "Instagram", description: "โฆษณาด้วยรูปภาพและวิดีโอบน Instagram" },
  { value: "TIKTOK", label: "TikTok Ads", description: "เข้าถึงกลุ่มเป้าหมายรุ่นใหม่ด้วยวิดีโอ" },
  { value: "LINKEDIN", label: "LinkedIn Ads", description: "โฆษณาสำหรับธุรกิจ B2B และมืออาชีพ" },
  { value: "TWITTER", label: "Twitter/X Ads", description: "โฆษณาแบบเรียลไทม์และเทรนด์" },
  { value: "YOUTUBE", label: "YouTube Ads", description: "วิดีโอโฆษณาบน YouTube" },
]

const GENERIC_OBJECTIVES = [
  { value: "AWARENESS", label: "Brand Awareness", description: "เพิ่มการรับรู้แบรนด์" },
  { value: "TRAFFIC", label: "Website Traffic", description: "ดึงคนเข้าเว็บไซต์" },
  { value: "ENGAGEMENT", label: "Engagement", description: "เพิ่มยอดไลค์ คอมเมนต์ และแชร์" },
  { value: "LEADS", label: "Lead Generation", description: "เก็บข้อมูลลูกค้าเป้าหมาย" },
  { value: "CONVERSIONS", label: "Conversions", description: "เพิ่ม Conversion บนเว็บไซต์" },
  { value: "SALES", label: "Sales", description: "เพิ่มยอดขายสินค้า" },
]

// Facebook ODAX objectives (Outcome-Driven Ad Experiences)
const FACEBOOK_OBJECTIVES = [
  { value: "OUTCOME_AWARENESS", label: "Awareness", description: "เพิ่มการรับรู้แบรนด์ให้มากที่สุด" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic", description: "ส่งคนไปยังเว็บไซต์หรือแอป" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement", description: "เพิ่มการมีส่วนร่วมกับโพสต์" },
  { value: "OUTCOME_LEADS", label: "Leads", description: "เก็บ Lead ผ่าน Facebook Form" },
  { value: "OUTCOME_APP_PROMOTION", label: "App Promotion", description: "เพิ่มการติดตั้งและใช้งานแอป" },
  { value: "OUTCOME_SALES", label: "Sales", description: "เพิ่มยอดขายผ่าน Conversion" },
]

type Platform = "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "LINKEDIN" | "TWITTER" | "YOUTUBE" | "PINTEREST"

interface FacebookAdAccountInfo {
  id: string
  adAccountId: string
  adAccountName: string
  currency: string | null
  timezone: string | null
  businessName: string | null
  isActive: boolean
  socialAccount: {
    accountName: string
    tokenExpiresAt: string | null
    isActive: boolean
  }
}

export default function CreateAdPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [platform, setPlatform] = useState<Platform | "">("")
  const [objective, setObjective] = useState("")
  const [dailyBudget, setDailyBudget] = useState("")
  const [totalBudget, setTotalBudget] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [adContent, setAdContent] = useState("")

  // Facebook-specific state
  const [fbAccounts, setFbAccounts] = useState<FacebookAdAccountInfo[]>([])
  const [selectedFbAccountId, setSelectedFbAccountId] = useState("")
  const [loadingFbAccounts, setLoadingFbAccounts] = useState(false)

  // AI assistance
  const aiAdCopy = useAIAssist()
  const aiAudience = useAIAssist()

  const handleAIAdCopy = async () => {
    const result = await aiAdCopy.generate("ad_copy", {
      productName: name,
      platform: platform || "facebook",
      objective: objective || "conversions",
      audience: targetAudience || "general",
    })
    if (result) {
      setAdContent(result)
      toast.success("AI สร้าง ad copy แล้ว")
    }
  }

  const handleAIAudience = async () => {
    const result = await aiAudience.generate("improve_text", {
      text: targetAudience || name,
      purpose: `กำหนดกลุ่มเป้าหมายสำหรับโฆษณา "${name}" บน ${platform || "social media"} วัตถุประสงค์: ${objective || "conversions"} — ให้อธิบายกลุ่มเป้าหมายที่เหมาะสม (เพศ, อายุ, ความสนใจ, พฤติกรรม, ที่อยู่)`,
    })
    if (result) {
      setTargetAudience(result)
      toast.success("AI แนะนำกลุ่มเป้าหมายแล้ว")
    }
  }

  const isFacebookPlatform = platform === "FACEBOOK"
  const objectives = isFacebookPlatform ? FACEBOOK_OBJECTIVES : GENERIC_OBJECTIVES
  const hasFbAccounts = fbAccounts.length > 0

  // Load Facebook ad accounts when platform changes to Facebook
  useEffect(() => {
    if (isFacebookPlatform) {
      setLoadingFbAccounts(true)
      getFacebookAdAccounts()
        .then((accounts) => {
          const typed = accounts as unknown as FacebookAdAccountInfo[]
          setFbAccounts(typed)
          if (typed.length === 1) {
            setSelectedFbAccountId(typed[0].id)
          }
        })
        .catch(() => {
          setFbAccounts([])
        })
        .finally(() => setLoadingFbAccounts(false))
    } else {
      setFbAccounts([])
      setSelectedFbAccountId("")
    }
    // Reset objective when switching platforms since they differ
    setObjective("")
  }, [isFacebookPlatform])

  const canNext = () => {
    if (step === 1) {
      if (!name.trim() || !platform || !objective) return false
      // Facebook requires a connected account
      if (isFacebookPlatform && selectedFbAccountId && !hasFbAccounts) return false
      return true
    }
    if (step === 2) return true
    if (step === 3) return true
    return true
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      if (isFacebookPlatform && selectedFbAccountId) {
        // Create on Facebook API + local DB
        await createFacebookCampaign({
          facebookAdAccountId: selectedFbAccountId,
          name: name.trim(),
          objective,
          dailyBudget: dailyBudget ? parseFloat(dailyBudget) : undefined,
        })
        toast.success("สร้างแคมเปญบน Facebook สำเร็จ")
      } else {
        // Create locally only
        await createAdsCampaign({
          name: name.trim(),
          platform: platform as Platform,
          objective,
          dailyBudget: dailyBudget ? parseFloat(dailyBudget) : undefined,
          totalBudget: totalBudget ? parseFloat(totalBudget) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          targetAudience: targetAudience.trim() || undefined,
          adContent: adContent.trim() || undefined,
        })
        toast.success("สร้างแคมเปญโฆษณาสำเร็จ")
      }
      router.push("/ads")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถสร้างแคมเปญได้"
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedFbAccount = fbAccounts.find((a) => a.id === selectedFbAccountId)

  return (
    <div className="space-y-6">
      <PageHeader heading="สร้างแคมเปญโฆษณา" description="ตั้งค่าแคมเปญโฆษณาใหม่" backHref="/ads" />

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: "แคมเปญ", icon: Target },
          { num: 2, label: "งบประมาณ", icon: DollarSign },
          { num: 3, label: "กลุ่มเป้าหมาย", icon: Users },
          { num: 4, label: "ตรวจสอบ", icon: Check },
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
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">รายละเอียดแคมเปญ</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อแคมเปญ *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น โปรโมชั่นซัมเมอร์ 2026" />
              </div>
              <div className="space-y-2">
                <Label>แพลตฟอร์ม *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value as Platform)}
                      className={`rounded-lg border p-3 text-left transition-colors ${platform === p.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      <div className="flex items-center gap-2">
                        {p.value === "FACEBOOK" && <Facebook className="h-4 w-4 text-blue-600" />}
                        <p className="text-sm font-medium">{p.label}</p>
                        {p.hasFbApi && (
                          <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700 text-xs dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
                            API
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Facebook Ad Account Selection */}
              {isFacebookPlatform && (
                <div className="space-y-2">
                  <Label>บัญชี Facebook Ads *</Label>
                  {loadingFbAccounts ? (
                    <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังโหลดบัญชี Facebook Ads...
                    </div>
                  ) : hasFbAccounts ? (
                    <Select value={selectedFbAccountId} onValueChange={setSelectedFbAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบัญชี Facebook Ads" />
                      </SelectTrigger>
                      <SelectContent>
                        {fbAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            <span className="flex items-center gap-2">
                              <Facebook className="h-3.5 w-3.5 text-blue-600" />
                              {acc.adAccountName}
                              {acc.businessName ? ` (${acc.businessName})` : ""}
                              {acc.currency ? ` · ${acc.currency}` : ""}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">ยังไม่มีบัญชี Facebook Ads ที่เชื่อมต่อ</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          กรุณาเชื่อมต่อ Facebook ก่อน หรือสร้างแคมเปญแบบ local (ไม่ push ไป Facebook)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto shrink-0"
                        onClick={() => { window.location.href = "/api/facebook/auth" }}
                      >
                        <Facebook className="mr-1 h-3.5 w-3.5" />เชื่อมต่อ
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>วัตถุประสงค์ *</Label>
                {isFacebookPlatform && (
                  <p className="text-xs text-muted-foreground">
                    Facebook ODAX (Outcome-Driven Ad Experiences) — เลือกเป้าหมายที่ต้องการ
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {objectives.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setObjective(o.value)}
                      className={`rounded-lg border p-3 text-left transition-colors ${objective === o.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      <p className="text-sm font-medium">{o.label}</p>
                      <p className="text-xs text-muted-foreground">{o.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Budget */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งบประมาณและกำหนดการ</CardTitle>
            {isFacebookPlatform && selectedFbAccountId && (
              <CardDescription>
                งบประมาณจะถูกตั้งค่าบน Facebook Ads Manager โดยตรง
                {selectedFbAccount?.currency ? ` (สกุลเงิน: ${selectedFbAccount.currency})` : ""}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>งบรายวัน (฿)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                  <Input type="number" min={0} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} className="pl-9" placeholder="50" />
                </div>
                {isFacebookPlatform && (
                  <p className="text-xs text-muted-foreground">Facebook ต้องการงบรายวันขั้นต่ำ ขึ้นกับสกุลเงิน</p>
                )}
              </div>
              {!isFacebookPlatform && (
                <div className="space-y-2">
                  <Label>งบทั้งหมด (฿)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
                    <Input type="number" min={0} value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} className="pl-9" placeholder="1000" />
                  </div>
                </div>
              )}
            </div>
            {!isFacebookPlatform && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>วันเริ่มต้น</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>วันสิ้นสุด</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            )}
            {isFacebookPlatform && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <p className="font-medium">Facebook Campaign</p>
                <p className="text-xs mt-1">แคมเปญจะถูกสร้างในสถานะ &quot;หยุดชั่วคราว&quot; (PAUSED) คุณสามารถเปิดใช้งานได้ภายหลังจากหน้าจัดการ Ads</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Audience & Content */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base">กลุ่มเป้าหมายและเนื้อหา</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>กลุ่มเป้าหมาย</Label>
                <Button variant="ghost" size="sm" onClick={handleAIAudience} disabled={aiAudience.isLoading}>
                  {aiAudience.isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  AI แนะนำ
                </Button>
              </div>
              <Textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} rows={3} placeholder="อธิบายกลุ่มเป้าหมาย (เพศ, อายุ, ความสนใจ, พฤติกรรม)" />
              {isFacebookPlatform && (
                <p className="text-xs text-muted-foreground">การกำหนดกลุ่มเป้าหมายแบบละเอียดสามารถตั้งค่าเพิ่มได้ใน Facebook Ads Manager</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>เนื้อหาโฆษณา / Ad Copy</Label>
                <Button variant="ghost" size="sm" onClick={handleAIAdCopy} disabled={aiAdCopy.isLoading}>
                  {aiAdCopy.isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  AI สร้าง Ad Copy
                </Button>
              </div>
              <Textarea value={adContent} onChange={(e) => setAdContent(e.target.value)} rows={4} placeholder="เขียน ad copy หรืออธิบายสิ่งที่ต้องการโปรโมท" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base">ตรวจสอบแคมเปญ</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">ชื่อแคมเปญ</p>
                  <p className="text-sm font-medium">{name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">แพลตฟอร์ม</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{PLATFORMS.find((p) => p.value === platform)?.label}</p>
                    {isFacebookPlatform && selectedFbAccountId && (
                      <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700 text-xs dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
                        Facebook API
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">วัตถุประสงค์</p>
                  <p className="text-sm font-medium">{objectives.find((o) => o.value === objective)?.label}</p>
                </div>
                {isFacebookPlatform && selectedFbAccount && (
                  <div>
                    <p className="text-xs text-muted-foreground">บัญชี Facebook Ads</p>
                    <p className="text-sm font-medium">{selectedFbAccount.adAccountName}</p>
                  </div>
                )}
                {dailyBudget && (
                  <div>
                    <p className="text-xs text-muted-foreground">งบรายวัน</p>
                    <p className="text-sm font-medium">฿{dailyBudget}</p>
                  </div>
                )}
                {totalBudget && !isFacebookPlatform && (
                  <div>
                    <p className="text-xs text-muted-foreground">งบทั้งหมด</p>
                    <p className="text-sm font-medium">฿{totalBudget}</p>
                  </div>
                )}
                {startDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">วันเริ่มต้น</p>
                    <p className="text-sm font-medium">{startDate}</p>
                  </div>
                )}
                {endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">วันสิ้นสุด</p>
                    <p className="text-sm font-medium">{endDate}</p>
                  </div>
                )}
              </div>
              {targetAudience && (
                <div>
                  <p className="text-xs text-muted-foreground">กลุ่มเป้าหมาย</p>
                  <p className="text-sm">{targetAudience}</p>
                </div>
              )}
              {isFacebookPlatform && selectedFbAccountId && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  <p className="font-medium flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    จะสร้างแคมเปญบน Facebook Ads Manager
                  </p>
                  <p className="text-xs mt-1">แคมเปญจะเริ่มในสถานะ PAUSED — สามารถเปิดใช้งานได้จากหน้าจัดการ Ads</p>
                </div>
              )}
              {isFacebookPlatform && !selectedFbAccountId && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <p className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    จะสร้างแคมเปญแบบ Local เท่านั้น
                  </p>
                  <p className="text-xs mt-1">ไม่ได้เชื่อมต่อ Facebook Ad Account — แคมเปญจะบันทึกในระบบเท่านั้น ไม่ push ไป Facebook</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" />ย้อนกลับ
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            ถัดไป<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {isFacebookPlatform && selectedFbAccountId ? "สร้างแคมเปญบน Facebook" : "สร้างแคมเปญ"}
          </Button>
        )}
      </div>
    </div>
  )
}
