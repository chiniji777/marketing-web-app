"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Pause,
  RefreshCw,
  Loader2,
  Facebook,
  ExternalLink,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Plus,
  Trash2,
  BarChart3,
  Settings,
  Target,
  Users,
  Layers,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import {
  getAdsCampaign,
  getFacebookCampaignInsights,
  getFacebookCampaignDailyInsights,
  getFacebookAdSets,
  createFacebookAdSet,
  updateFacebookAdSetStatus,
  deleteFacebookAdSet,
  getFacebookAdSetInsights,
  getFacebookAds,
  createFacebookAd,
  updateFacebookAdStatus,
  deleteFacebookAd,
  updateFacebookCampaign,
  getFacebookPages,
} from "@/server/actions/ads"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

interface CampaignDetail {
  id: string
  name: string
  platform: string
  platformCampaignId: string | null
  facebookAdAccountId: string | null
  objective: string
  status: string
  dailyBudget: unknown
  totalBudget: unknown
  performanceData: Record<string, number> | null
  startDate: string | null
  endDate: string | null
  targetAudience: Record<string, unknown> | null
  creativeAssets: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  adSets: Array<{
    id: string
    name: string
    platformAdSetId: string | null
    targetAudience: Record<string, unknown>
    budget: unknown
    bidAmount: unknown
    status: string
    metrics: Record<string, number> | null
  }>
  facebookAdAccount: {
    id: string
    adAccountId: string
    adAccountName: string
    currency: string | null
    timezone: string | null
    businessName: string | null
  } | null
}

interface FbAdSet {
  id: string
  name: string
  status: string
  campaignId: string
  dailyBudget?: number
  lifetimeBudget?: number
  billingEvent: string
  optimizationGoal: string
  targeting?: Record<string, unknown>
  startTime?: string
  endTime?: string
  createdTime: string
  updatedTime: string
}

interface FbAd {
  id: string
  name: string
  status: string
  adSetId: string
  creativeId?: string
  createdTime: string
  updatedTime: string
}

interface DailyInsight {
  impressions: number
  clicks: number
  spend: number
  cpc: number
  cpm: number
  ctr: number
  reach: number
  dateStart: string
  dateStop: string
}

interface FbPage {
  id: string
  name: string
  accessToken: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "แบบร่าง", variant: "secondary" },
  PENDING_REVIEW: { label: "รอตรวจสอบ", variant: "outline" },
  ACTIVE: { label: "กำลังทำงาน", variant: "default" },
  PAUSED: { label: "หยุดชั่วคราว", variant: "outline" },
  COMPLETED: { label: "เสร็จสิ้น", variant: "secondary" },
  REJECTED: { label: "ถูกปฏิเสธ", variant: "destructive" },
}

const OPTIMIZATION_GOALS = [
  { value: "LINK_CLICKS", label: "Link Clicks" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "REACH", label: "Reach" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing Page Views" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
  { value: "LEAD_GENERATION", label: "Lead Generation" },
  { value: "POST_ENGAGEMENT", label: "Post Engagement" },
  { value: "VIDEO_VIEWS", label: "Video Views" },
]

const BILLING_EVENTS = [
  { value: "IMPRESSIONS", label: "Impressions (CPM)" },
  { value: "LINK_CLICKS", label: "Link Clicks (CPC)" },
  { value: "POST_ENGAGEMENT", label: "Post Engagement" },
]

const CTA_TYPES = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "GET_OFFER", label: "Get Offer" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "BOOK_TRAVEL", label: "Book Now" },
  { value: "WATCH_MORE", label: "Watch More" },
]

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([])
  const [fbAdSets, setFbAdSets] = useState<FbAdSet[]>([])
  const [fbAds, setFbAds] = useState<Record<string, FbAd[]>>({})
  const [fbPages, setFbPages] = useState<FbPage[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Ad Set creation dialog
  const [showAdSetDialog, setShowAdSetDialog] = useState(false)
  const [newAdSetName, setNewAdSetName] = useState("")
  const [newAdSetBudget, setNewAdSetBudget] = useState("")
  const [newAdSetOptGoal, setNewAdSetOptGoal] = useState("LINK_CLICKS")
  const [newAdSetBilling, setNewAdSetBilling] = useState("IMPRESSIONS")
  const [newAdSetAgeMin, setNewAdSetAgeMin] = useState("18")
  const [newAdSetAgeMax, setNewAdSetAgeMax] = useState("65")
  const [newAdSetGenders, setNewAdSetGenders] = useState("0")
  const [newAdSetLocales, setNewAdSetLocales] = useState("")
  const [newAdSetInterests, setNewAdSetInterests] = useState("")
  const [creatingAdSet, setCreatingAdSet] = useState(false)

  // Ad creation dialog
  const [showAdDialog, setShowAdDialog] = useState(false)
  const [adTargetSetId, setAdTargetSetId] = useState("")
  const [newAdName, setNewAdName] = useState("")
  const [newAdPageId, setNewAdPageId] = useState("")
  const [newAdMessage, setNewAdMessage] = useState("")
  const [newAdLink, setNewAdLink] = useState("")
  const [newAdCta, setNewAdCta] = useState("LEARN_MORE")
  const [creatingAd, setCreatingAd] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "adSet" | "ad"; id: string; name: string } | null>(null)

  // Campaign edit
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBudget, setEditBudget] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const isFb = campaign?.platformCampaignId != null

  const fetchCampaign = useCallback(async () => {
    try {
      const data = await getAdsCampaign(campaignId)
      if (!data) {
        router.push("/ads")
        return
      }
      setCampaign(data as unknown as CampaignDetail)
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลแคมเปญได้")
      router.push("/ads")
    } finally {
      setIsLoading(false)
    }
  }, [campaignId, router])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  // Load FB-specific data
  useEffect(() => {
    if (!campaign || !isFb) return

    const loadFbData = async () => {
      try {
        const [adSets, insights] = await Promise.all([
          getFacebookAdSets(campaignId),
          getFacebookCampaignDailyInsights(campaignId, 30).catch(() => []),
        ])
        setFbAdSets(adSets as unknown as FbAdSet[])
        setDailyInsights(insights as unknown as DailyInsight[])

        // Load ads for each ad set
        const adsMap: Record<string, FbAd[]> = {}
        for (const adSet of adSets as unknown as FbAdSet[]) {
          try {
            const ads = await getFacebookAds(adSet.id, campaignId)
            adsMap[adSet.id] = ads as unknown as FbAd[]
          } catch {
            adsMap[adSet.id] = []
          }
        }
        setFbAds(adsMap)

        // Load Facebook Pages
        if (campaign.facebookAdAccount?.id) {
          const pages = await getFacebookPages(campaign.facebookAdAccount.id)
          setFbPages(pages as unknown as FbPage[])
        }
      } catch {
        // Silent fail for FB data loading
      }
    }

    loadFbData()
  }, [campaign, isFb, campaignId])

  const handleRefreshInsights = async () => {
    setRefreshing(true)
    try {
      await getFacebookCampaignInsights(campaignId)
      const insights = await getFacebookCampaignDailyInsights(campaignId, 30)
      setDailyInsights(insights as unknown as DailyInsight[])
      await fetchCampaign()
      toast.success("อัปเดตข้อมูลประสิทธิภาพแล้ว")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลได้"
      toast.error(msg)
    } finally {
      setRefreshing(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!campaign) return
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
    try {
      await updateFacebookCampaign(campaignId, { status: newStatus as "ACTIVE" | "PAUSED" })
      toast.success(newStatus === "ACTIVE" ? "เปิดใช้งานแคมเปญแล้ว" : "หยุดแคมเปญชั่วคราวแล้ว")
      fetchCampaign()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอัปเดตสถานะได้"
      toast.error(msg)
    }
  }

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    try {
      await updateFacebookCampaign(campaignId, {
        name: editName || undefined,
        dailyBudget: editBudget ? parseFloat(editBudget) : undefined,
      })
      toast.success("อัปเดตแคมเปญบน Facebook แล้ว")
      setShowEditDialog(false)
      fetchCampaign()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอัปเดตได้"
      toast.error(msg)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCreateAdSet = async () => {
    if (!newAdSetName.trim()) return
    setCreatingAdSet(true)
    try {
      const targeting: Record<string, unknown> = {
        age_min: parseInt(newAdSetAgeMin) || 18,
        age_max: parseInt(newAdSetAgeMax) || 65,
        genders: newAdSetGenders !== "0" ? [parseInt(newAdSetGenders)] : [],
        geo_locations: { countries: ["TH"] },
      }

      if (newAdSetLocales.trim()) {
        targeting.geo_locations = {
          countries: newAdSetLocales.split(",").map((s) => s.trim().toUpperCase()),
        }
      }

      if (newAdSetInterests.trim()) {
        targeting.flexible_spec = [
          {
            interests: newAdSetInterests.split(",").map((s) => ({ name: s.trim() })),
          },
        ]
      }

      await createFacebookAdSet({
        campaignId,
        name: newAdSetName.trim(),
        dailyBudget: newAdSetBudget ? parseFloat(newAdSetBudget) : undefined,
        optimizationGoal: newAdSetOptGoal,
        billingEvent: newAdSetBilling,
        targeting,
      })
      toast.success("สร้าง Ad Set บน Facebook สำเร็จ")
      setShowAdSetDialog(false)
      resetAdSetForm()
      // Reload ad sets
      const adSets = await getFacebookAdSets(campaignId)
      setFbAdSets(adSets as unknown as FbAdSet[])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถสร้าง Ad Set ได้"
      toast.error(msg)
    } finally {
      setCreatingAdSet(false)
    }
  }

  const resetAdSetForm = () => {
    setNewAdSetName("")
    setNewAdSetBudget("")
    setNewAdSetOptGoal("LINK_CLICKS")
    setNewAdSetBilling("IMPRESSIONS")
    setNewAdSetAgeMin("18")
    setNewAdSetAgeMax("65")
    setNewAdSetGenders("0")
    setNewAdSetLocales("")
    setNewAdSetInterests("")
  }

  const handleCreateAd = async () => {
    if (!newAdName.trim() || !newAdPageId || !adTargetSetId) return
    setCreatingAd(true)
    try {
      await createFacebookAd({
        campaignId,
        adSetPlatformId: adTargetSetId,
        name: newAdName.trim(),
        pageId: newAdPageId,
        message: newAdMessage || undefined,
        link: newAdLink || undefined,
        callToActionType: newAdCta || undefined,
      })
      toast.success("สร้าง Ad บน Facebook สำเร็จ")
      setShowAdDialog(false)
      resetAdForm()
      // Reload ads for this ad set
      const ads = await getFacebookAds(adTargetSetId, campaignId)
      setFbAds((prev) => ({ ...prev, [adTargetSetId]: ads as unknown as FbAd[] }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถสร้าง Ad ได้"
      toast.error(msg)
    } finally {
      setCreatingAd(false)
    }
  }

  const resetAdForm = () => {
    setNewAdName("")
    setNewAdPageId("")
    setNewAdMessage("")
    setNewAdLink("")
    setNewAdCta("LEARN_MORE")
    setAdTargetSetId("")
  }

  const handleToggleAdSetStatus = async (adSetId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    try {
      await updateFacebookAdSetStatus(adSetId, campaignId, newStatus as "ACTIVE" | "PAUSED")
      toast.success(`Ad Set ${newStatus === "ACTIVE" ? "เปิด" : "หยุด"}แล้ว`)
      const adSets = await getFacebookAdSets(campaignId)
      setFbAdSets(adSets as unknown as FbAdSet[])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอัปเดตได้"
      toast.error(msg)
    }
  }

  const handleToggleAdStatus = async (adId: string, adSetId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    try {
      await updateFacebookAdStatus(adId, campaignId, newStatus as "ACTIVE" | "PAUSED")
      toast.success(`Ad ${newStatus === "ACTIVE" ? "เปิด" : "หยุด"}แล้ว`)
      const ads = await getFacebookAds(adSetId, campaignId)
      setFbAds((prev) => ({ ...prev, [adSetId]: ads as unknown as FbAd[] }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอัปเดตได้"
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === "adSet") {
        await deleteFacebookAdSet(deleteTarget.id, campaignId)
        const adSets = await getFacebookAdSets(campaignId)
        setFbAdSets(adSets as unknown as FbAdSet[])
      } else {
        await deleteFacebookAd(deleteTarget.id, campaignId)
        // Find which ad set this ad belongs to and reload
        for (const [setId, ads] of Object.entries(fbAds)) {
          if (ads.some((a) => a.id === deleteTarget.id)) {
            const newAds = await getFacebookAds(setId, campaignId)
            setFbAds((prev) => ({ ...prev, [setId]: newAds as unknown as FbAd[] }))
            break
          }
        }
      }
      toast.success(`ลบ ${deleteTarget.type === "adSet" ? "Ad Set" : "Ad"} แล้ว`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถลบได้"
      toast.error(msg)
    } finally {
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!campaign) return null

  const perf = campaign.performanceData ?? {}
  const totalImpressions = Number(perf.impressions ?? 0)
  const totalClicks = Number(perf.clicks ?? 0)
  const totalSpend = Number(perf.spend ?? 0)
  const totalReach = Number(perf.reach ?? 0)
  const ctr = Number(perf.ctr ?? 0)
  const cpc = Number(perf.cpc ?? 0)
  const cfg = statusConfig[campaign.status] ?? { label: campaign.status, variant: "outline" as const }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        heading={campaign.name}
        description={`${campaign.objective.toLowerCase().replace(/_/g, " ")}${campaign.facebookAdAccount ? ` · ${campaign.facebookAdAccount.adAccountName}` : ""}`}
        backHref="/ads"
      >
        <div className="flex items-center gap-2">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          {isFb && (
            <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
              <Facebook className="h-3 w-3" />Facebook API
            </Badge>
          )}
          {isFb && (
            <>
              <Button variant="outline" size="sm" onClick={() => {
                setEditName(campaign.name)
                setEditBudget(campaign.dailyBudget ? String(Number(campaign.dailyBudget)) : "")
                setShowEditDialog(true)
              }}>
                <Settings className="mr-1 h-3.5 w-3.5" />แก้ไข
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefreshInsights} disabled={refreshing}>
                {refreshing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
                Refresh
              </Button>
              <Button
                size="sm"
                variant={campaign.status === "ACTIVE" ? "outline" : "default"}
                onClick={handleStatusToggle}
              >
                {campaign.status === "ACTIVE" ? (
                  <><Pause className="mr-1 h-3.5 w-3.5" />หยุดชั่วคราว</>
                ) : (
                  <><Play className="mr-1 h-3.5 w-3.5" />เปิดใช้งาน</>
                )}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Performance Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">ค่าใช้จ่าย</p>
            </div>
            <p className="mt-1 text-2xl font-bold">฿{totalSpend.toLocaleString()}</p>
            {campaign.dailyBudget != null ? <p className="text-xs text-muted-foreground">งบรายวัน: ฿{Number(campaign.dailyBudget).toLocaleString()}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Impressions</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Reach: {totalReach.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Clicks</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">CPC: ฿{cpc.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">CTR</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{ctr.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">CPM: ฿{Number(perf.cpm ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {isFb ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />ภาพรวม</TabsTrigger>
            <TabsTrigger value="adsets" className="gap-1.5"><Layers className="h-3.5 w-3.5" />Ad Sets ({fbAdSets.length})</TabsTrigger>
            <TabsTrigger value="targeting" className="gap-1.5"><Users className="h-3.5 w-3.5" />Targeting</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {dailyInsights.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ค่าใช้จ่ายรายวัน (30 วัน)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyInsights}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dateStart" tickFormatter={(d) => String(d).slice(5)} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          formatter={(value) => [`฿${Number(value).toFixed(2)}`, "Spend"]}
                          labelFormatter={(label) => `วันที่ ${String(label)}`}
                        />
                        <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Impressions & Clicks รายวัน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyInsights}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dateStart" tickFormatter={(d) => String(d).slice(5)} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip labelFormatter={(label) => `วันที่ ${String(label)}`} />
                        <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" name="Impressions" strokeWidth={2} />
                        <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" name="Clicks" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">CTR รายวัน (%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={dailyInsights}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dateStart" tickFormatter={(d) => String(d).slice(5)} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          formatter={(value) => [`${Number(value).toFixed(2)}%`, "CTR"]}
                          labelFormatter={(label) => `วันที่ ${String(label)}`}
                        />
                        <Line type="monotone" dataKey="ctr" stroke="hsl(var(--chart-3))" name="CTR" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 text-sm text-muted-foreground">ยังไม่มีข้อมูล Insights</p>
                  <p className="text-xs text-muted-foreground">กดปุ่ม Refresh เพื่อดึงข้อมูลจาก Facebook</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Ad Sets Tab */}
          <TabsContent value="adsets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Facebook Ad Sets</h3>
              <Button size="sm" onClick={() => setShowAdSetDialog(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />สร้าง Ad Set
              </Button>
            </div>

            {fbAdSets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 text-sm text-muted-foreground">ยังไม่มี Ad Sets</p>
                  <p className="text-xs text-muted-foreground">สร้าง Ad Set เพื่อกำหนด audience, budget และ optimization</p>
                  <Button size="sm" className="mt-4" onClick={() => setShowAdSetDialog(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />สร้าง Ad Set แรก
                  </Button>
                </CardContent>
              </Card>
            ) : (
              fbAdSets.map((adSet) => {
                const adSetCfg = statusConfig[adSet.status] ?? { label: adSet.status, variant: "outline" as const }
                const ads = fbAds[adSet.id] ?? []
                return (
                  <Card key={adSet.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            {adSet.name}
                            <Badge variant={adSetCfg.variant} className="text-xs">{adSetCfg.label}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {adSet.optimizationGoal.replace(/_/g, " ")} · {adSet.billingEvent}
                            {adSet.dailyBudget ? ` · ฿${adSet.dailyBudget.toLocaleString()}/day` : ""}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleToggleAdSetStatus(adSet.id, adSet.status)}>
                            {adSet.status === "ACTIVE" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAdTargetSetId(adSet.id)
                              setShowAdDialog(true)
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({ type: "adSet", id: adSet.id, name: adSet.name })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Targeting info */}
                      {adSet.targeting ? (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {adSet.targeting.age_min != null ? (
                            <Badge variant="secondary" className="text-xs">อายุ {String(adSet.targeting.age_min)}-{String(adSet.targeting.age_max ?? 65)}</Badge>
                          ) : null}
                          {Array.isArray(adSet.targeting.genders) && adSet.targeting.genders.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              เพศ: {(adSet.targeting.genders as number[]).map((g: number) => g === 1 ? "ชาย" : "หญิง").join(", ")}
                            </Badge>
                          ) : null}
                          {adSet.targeting.geo_locations && typeof adSet.targeting.geo_locations === "object" ? (
                            <Badge variant="secondary" className="text-xs">
                              ประเทศ: {JSON.stringify((adSet.targeting.geo_locations as Record<string, unknown>).countries ?? [])}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Ads in this set */}
                      {ads.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">{ads.length} Ad(s)</p>
                          {ads.map((ad) => {
                            const adCfg = statusConfig[ad.status] ?? { label: ad.status, variant: "outline" as const }
                            return (
                              <div key={ad.id} className="flex items-center justify-between rounded-md border p-2 pl-3">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm">{ad.name}</span>
                                  <Badge variant={adCfg.variant} className="text-xs">{adCfg.label}</Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleToggleAdStatus(ad.id, adSet.id, ad.status)}>
                                    {ad.status === "ACTIVE" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteTarget({ type: "ad", id: ad.id, name: ad.name })}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">ยังไม่มี Ads — กดปุ่ม + เพื่อสร้าง</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          {/* Targeting Tab */}
          <TabsContent value="targeting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audience Targeting</CardTitle>
                <CardDescription>ข้อมูลกลุ่มเป้าหมายของแต่ละ Ad Set</CardDescription>
              </CardHeader>
              <CardContent>
                {fbAdSets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ยังไม่มี Ad Set — สร้าง Ad Set ก่อนเพื่อกำหนดกลุ่มเป้าหมาย</p>
                ) : (
                  <div className="space-y-4">
                    {fbAdSets.map((adSet) => (
                      <div key={adSet.id} className="rounded-lg border p-4">
                        <h4 className="font-medium text-sm">{adSet.name}</h4>
                        {adSet.targeting ? (
                          <div className="mt-2 grid gap-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-muted-foreground">อายุ</span>
                                <p>{String(adSet.targeting.age_min ?? 18)} - {String(adSet.targeting.age_max ?? 65)} ปี</p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">เพศ</span>
                                <p>
                                  {adSet.targeting.genders && Array.isArray(adSet.targeting.genders) && adSet.targeting.genders.length > 0
                                    ? (adSet.targeting.genders as number[]).map((g: number) => g === 1 ? "ชาย" : "หญิง").join(", ")
                                    : "ทั้งหมด"}
                                </p>
                              </div>
                            </div>
                            {adSet.targeting.geo_locations && typeof adSet.targeting.geo_locations === "object" ? (
                              <div>
                                <span className="text-xs text-muted-foreground">ที่ตั้ง</span>
                                <p>{JSON.stringify((adSet.targeting.geo_locations as Record<string, unknown>).countries ?? (adSet.targeting.geo_locations as Record<string, unknown>).cities ?? "ไม่ระบุ")}</p>
                              </div>
                            ) : null}
                            {Array.isArray(adSet.targeting.flexible_spec) ? (
                              <div>
                                <span className="text-xs text-muted-foreground">ความสนใจ</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(adSet.targeting.flexible_spec as Array<{ interests?: Array<{ name: string }> }>).flatMap((spec) =>
                                    (spec.interests ?? []).map((interest) => (
                                      <Badge key={interest.name} variant="secondary" className="text-xs">{interest.name}</Badge>
                                    ))
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">ไม่มีข้อมูล targeting</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-Facebook campaign info */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายละเอียดแคมเปญ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">แพลตฟอร์ม</p>
                <p className="text-sm font-medium">{campaign.platform}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">วัตถุประสงค์</p>
                <p className="text-sm font-medium">{campaign.objective}</p>
              </div>
              {campaign.dailyBudget != null ? (
                <div>
                  <p className="text-xs text-muted-foreground">งบรายวัน</p>
                  <p className="text-sm font-medium">฿{Number(campaign.dailyBudget).toLocaleString()}</p>
                </div>
              ) : null}
              {campaign.totalBudget != null ? (
                <div>
                  <p className="text-xs text-muted-foreground">งบทั้งหมด</p>
                  <p className="text-sm font-medium">฿{Number(campaign.totalBudget).toLocaleString()}</p>
                </div>
              ) : null}
              {campaign.startDate ? (
                <div>
                  <p className="text-xs text-muted-foreground">วันเริ่มต้น</p>
                  <p className="text-sm font-medium">{new Date(campaign.startDate).toLocaleDateString("th-TH")}</p>
                </div>
              ) : null}
              {campaign.endDate ? (
                <div>
                  <p className="text-xs text-muted-foreground">วันสิ้นสุด</p>
                  <p className="text-sm font-medium">{new Date(campaign.endDate).toLocaleDateString("th-TH")}</p>
                </div>
              ) : null}
            </div>
            {campaign.adSets.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Ad Sets ({campaign.adSets.length})</h4>
                <div className="space-y-2">
                  {campaign.adSets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between rounded-md border p-2 pl-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{set.name}</span>
                        <Badge variant={statusConfig[set.status]?.variant ?? "outline"} className="text-xs">
                          {statusConfig[set.status]?.label ?? set.status}
                        </Badge>
                      </div>
                      {set.budget != null ? <span className="text-xs text-muted-foreground">฿{Number(set.budget).toLocaleString()}</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Ad Set Dialog */}
      <Dialog open={showAdSetDialog} onOpenChange={setShowAdSetDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>สร้าง Ad Set บน Facebook</DialogTitle>
            <DialogDescription>กำหนดกลุ่มเป้าหมาย, งบประมาณ และ optimization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อ Ad Set *</Label>
              <Input value={newAdSetName} onChange={(e) => setNewAdSetName(e.target.value)} placeholder="เช่น กลุ่มผู้หญิง 25-40 กรุงเทพ" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>งบรายวัน (฿)</Label>
                <Input type="number" min={1} value={newAdSetBudget} onChange={(e) => setNewAdSetBudget(e.target.value)} placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>Optimization Goal</Label>
                <Select value={newAdSetOptGoal} onValueChange={setNewAdSetOptGoal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPTIMIZATION_GOALS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Billing Event</Label>
              <Select value={newAdSetBilling} onValueChange={setNewAdSetBilling}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_EVENTS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />Targeting</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>อายุต่ำสุด</Label>
                  <Input type="number" min={13} max={65} value={newAdSetAgeMin} onChange={(e) => setNewAdSetAgeMin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>อายุสูงสุด</Label>
                  <Input type="number" min={13} max={65} value={newAdSetAgeMax} onChange={(e) => setNewAdSetAgeMax(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>เพศ</Label>
                  <Select value={newAdSetGenders} onValueChange={setNewAdSetGenders}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">ทั้งหมด</SelectItem>
                      <SelectItem value="1">ชาย</SelectItem>
                      <SelectItem value="2">หญิง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Label>ประเทศ (รหัส ISO, คั่นด้วยลูกน้ำ)</Label>
                <Input value={newAdSetLocales} onChange={(e) => setNewAdSetLocales(e.target.value)} placeholder="TH, SG, MY" />
              </div>
              <div className="mt-3 space-y-2">
                <Label>ความสนใจ (คั่นด้วยลูกน้ำ)</Label>
                <Input value={newAdSetInterests} onChange={(e) => setNewAdSetInterests(e.target.value)} placeholder="Shopping, Technology, Fashion" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdSetDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateAdSet} disabled={!newAdSetName.trim() || creatingAdSet}>
              {creatingAdSet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              สร้าง Ad Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ad Dialog */}
      <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>สร้าง Ad บน Facebook</DialogTitle>
            <DialogDescription>สร้างโฆษณาพร้อม creative ในขั้นตอนเดียว</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อ Ad *</Label>
              <Input value={newAdName} onChange={(e) => setNewAdName(e.target.value)} placeholder="เช่น Ad รูปสินค้า A" />
            </div>
            <div className="space-y-2">
              <Label>Facebook Page *</Label>
              {fbPages.length > 0 ? (
                <Select value={newAdPageId} onValueChange={setNewAdPageId}>
                  <SelectTrigger><SelectValue placeholder="เลือก Facebook Page" /></SelectTrigger>
                  <SelectContent>
                    {fbPages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">ไม่พบ Facebook Pages — ตรวจสอบว่าบัญชี Facebook มีสิทธิ์จัดการ Page</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>ข้อความโฆษณา</Label>
              <Textarea value={newAdMessage} onChange={(e) => setNewAdMessage(e.target.value)} rows={3} placeholder="ข้อความที่จะแสดงในโฆษณา" />
            </div>
            <div className="space-y-2">
              <Label>ลิงก์ปลายทาง (URL)</Label>
              <Input value={newAdLink} onChange={(e) => setNewAdLink(e.target.value)} placeholder="https://yoursite.com/landing" />
            </div>
            <div className="space-y-2">
              <Label>Call to Action</Label>
              <Select value={newAdCta} onValueChange={setNewAdCta}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CTA_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateAd} disabled={!newAdName.trim() || !newAdPageId || creatingAd}>
              {creatingAd ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              สร้าง Ad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขแคมเปญ Facebook</DialogTitle>
            <DialogDescription>อัปเดตชื่อและงบประมาณบน Facebook Ads Manager</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อแคมเปญ</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>งบรายวัน (฿)</Label>
              <Input type="number" min={0} value={editBudget} onChange={(e) => setEditBudget(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ {deleteTarget?.type === "adSet" ? "Ad Set" : "Ad"} &quot;{deleteTarget?.name}&quot; ออกจาก Facebook? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
