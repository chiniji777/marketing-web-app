"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Target,
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Trash2,
  Pause,
  Play,
  RefreshCw,
  Facebook,
  Loader2,
  Unlink,
  BarChart3,
  ExternalLink,
  Image as ImageIcon,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import {
  getAdsCampaigns,
  getAdsStats,
  updateAdsCampaign,
  deleteAdsCampaign,
  getFacebookAdAccounts,
  disconnectFacebookAdAccount,
  syncFacebookCampaigns,
  updateFacebookCampaignStatus,
  getFacebookCampaignInsights,
} from "@/server/actions/ads"

const PLATFORM_OPTIONS = [
  { value: "all", label: "ทุกแพลตฟอร์ม" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TWITTER", label: "Twitter/X" },
  { value: "YOUTUBE", label: "YouTube" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "แบบร่าง" },
  { value: "PENDING_REVIEW", label: "รอตรวจสอบ" },
  { value: "ACTIVE", label: "กำลังทำงาน" },
  { value: "PAUSED", label: "หยุดชั่วคราว" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
]

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

interface AdsCampaign {
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
  createdAt: string
  adSets: { id: string; name: string; metrics: Record<string, number> | null; status: string }[]
}

interface Stats {
  totalCampaigns: number
  active: number
  totalSpend: number
  totalBudget: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  ctr: number
  conversionRate: number
  totalSets: number
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "แบบร่าง", variant: "secondary" },
  PENDING_REVIEW: { label: "รอตรวจสอบ", variant: "outline" },
  ACTIVE: { label: "กำลังทำงาน", variant: "default" },
  PAUSED: { label: "หยุดชั่วคราว", variant: "outline" },
  COMPLETED: { label: "เสร็จสิ้น", variant: "secondary" },
  REJECTED: { label: "ถูกปฏิเสธ", variant: "destructive" },
}

export default function AdsPage() {
  const router = useRouter()
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([])
  const [fbAccounts, setFbAccounts] = useState<FacebookAdAccountInfo[]>([])
  const [search, setSearch] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [refreshingInsights, setRefreshingInsights] = useState<string | null>(null)
  const [disconnectId, setDisconnectId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [statsData, campsData, fbData] = await Promise.all([
        getAdsStats(),
        getAdsCampaigns({
          search: search || undefined,
          platform: platformFilter !== "all" ? platformFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          page,
          perPage: 20,
        }),
        getFacebookAdAccounts(),
      ])
      setStats(statsData)
      setCampaigns(campsData.campaigns as unknown as AdsCampaign[])
      setTotalPages(campsData.pagination.totalPages)
      setFbAccounts(fbData as unknown as FacebookAdAccountInfo[])
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลโฆษณาได้")
    } finally {
      setIsLoading(false)
    }
  }, [search, platformFilter, statusFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusChange = async (campaign: AdsCampaign, newStatus: string) => {
    try {
      // If Facebook campaign, sync status to FB
      if (campaign.platformCampaignId && campaign.facebookAdAccountId && (newStatus === "ACTIVE" || newStatus === "PAUSED")) {
        await updateFacebookCampaignStatus(campaign.id, newStatus)
        toast.success(`แคมเปญ Facebook ${newStatus === "ACTIVE" ? "เปิดใช้งาน" : "หยุดชั่วคราว"}แล้ว`)
      } else {
        await updateAdsCampaign({ id: campaign.id, status: newStatus as "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "PAUSED" | "COMPLETED" | "REJECTED" })
        toast.success(`อัปเดตสถานะแคมเปญแล้ว`)
      }
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอัปเดตแคมเปญได้"
      toast.error(msg)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdsCampaign(id)
      toast.success("ลบแคมเปญแล้ว")
      fetchData()
    } catch {
      toast.error("ไม่สามารถลบแคมเปญได้")
    }
  }

  const handleSync = async (fbAccountId: string) => {
    setSyncing(fbAccountId)
    try {
      const result = await syncFacebookCampaigns(fbAccountId)
      toast.success(`Sync สำเร็จ: ${result.created} ใหม่, ${result.synced} อัปเดต (ทั้งหมด ${result.total} แคมเปญ)`)
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถ sync ได้"
      toast.error(msg)
    } finally {
      setSyncing(null)
    }
  }

  const handleRefreshInsights = async (campaignId: string) => {
    setRefreshingInsights(campaignId)
    try {
      await getFacebookCampaignInsights(campaignId)
      toast.success("อัปเดตข้อมูลประสิทธิภาพแล้ว")
      fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลได้"
      toast.error(msg)
    } finally {
      setRefreshingInsights(null)
    }
  }

  const handleDisconnect = async () => {
    if (!disconnectId) return
    try {
      await disconnectFacebookAdAccount(disconnectId)
      toast.success("ยกเลิกการเชื่อมต่อ Facebook Ad Account แล้ว")
      fetchData()
    } catch {
      toast.error("ไม่สามารถยกเลิกการเชื่อมต่อได้")
    } finally {
      setDisconnectId(null)
    }
  }

  const handleConnectFacebook = () => {
    window.location.href = "/api/facebook/auth"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.ads.title} description={t.ads.subtitle}>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/ads/audiences"><Users className="mr-2 h-4 w-4" />Audiences</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/ads/creatives"><ImageIcon className="mr-2 h-4 w-4" />Creative Library</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/ads/rules"><Zap className="mr-2 h-4 w-4" />Auto-Rules</Link>
          </Button>
          <Button variant="outline" onClick={handleConnectFacebook}>
            <Facebook className="mr-2 h-4 w-4" />เชื่อมต่อ Facebook
          </Button>
          <Button asChild>
            <Link href="/ads/create"><Plus className="mr-2 h-4 w-4" />สร้างแคมเปญ</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Connected Facebook Accounts */}
      {fbAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Facebook className="h-4 w-4 text-blue-600" />
              บัญชี Facebook Ads ที่เชื่อมต่อ
            </CardTitle>
            <CardDescription>จัดการบัญชีโฆษณา Facebook ที่เชื่อมต่อกับระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fbAccounts.map((acc) => {
                const tokenExpired = acc.socialAccount.tokenExpiresAt
                  ? new Date(acc.socialAccount.tokenExpiresAt) < new Date()
                  : false
                return (
                  <div key={acc.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                        <Facebook className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{acc.adAccountName}</p>
                        <p className="text-xs text-muted-foreground">
                          {acc.socialAccount.accountName}
                          {acc.businessName ? ` · ${acc.businessName}` : ""}
                          {acc.currency ? ` · ${acc.currency}` : ""}
                        </p>
                      </div>
                      {tokenExpired && (
                        <Badge variant="destructive" className="text-xs">Token หมดอายุ</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(acc.id)}
                        disabled={syncing === acc.id}
                      >
                        {syncing === acc.id ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />
                        )}
                        Sync
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDisconnectId(acc.id)}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t.ads.totalCampaigns} value={String(stats.totalCampaigns)} icon={Target} change={`${stats.active} กำลังทำงาน`} changeType="positive" />
          <StatCard title={t.ads.totalSpend} value={`฿${stats.totalSpend.toLocaleString()}`} icon={DollarSign} description={`งบทั้งหมด ฿${stats.totalBudget.toLocaleString()}`} />
          <StatCard title="Impressions" value={stats.totalImpressions.toLocaleString()} icon={Eye} change={`${stats.ctr}% CTR`} changeType="positive" />
          <StatCard title={t.ads.conversions} value={String(stats.totalConversions)} icon={TrendingUp} change={`${stats.conversionRate}% rate`} changeType="positive" />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหาแคมเปญ..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <EmptyState icon={Target} title="ยังไม่มีแคมเปญโฆษณา" description="สร้างแคมเปญโฆษณาแรกของคุณ หรือเชื่อมต่อ Facebook เพื่อ sync แคมเปญที่มีอยู่">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleConnectFacebook}>
              <Facebook className="mr-2 h-4 w-4" />เชื่อมต่อ Facebook
            </Button>
            <Button asChild>
              <Link href="/ads/create"><Plus className="mr-2 h-4 w-4" />สร้างแคมเปญ</Link>
            </Button>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const cfg = statusConfig[campaign.status] ?? { label: campaign.status, variant: "outline" as const }
            const perf = campaign.performanceData ?? {}
            const totalImpressions = Number(perf.impressions ?? 0)
            const totalClicks = Number(perf.clicks ?? 0)
            const isFbCampaign = !!campaign.platformCampaignId

            return (
              <Card
                key={campaign.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => router.push(`/ads/${campaign.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{campaign.name}</span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <Badge variant="outline" className="gap-1">
                          {campaign.platform === "FACEBOOK" && <Facebook className="h-3 w-3" />}
                          {campaign.platform}
                        </Badge>
                        {isFbCampaign && (
                          <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
                            <ExternalLink className="h-3 w-3" />
                            Facebook API
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground capitalize">{campaign.objective.toLowerCase().replace(/_/g, " ")}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ใช้ไป: ฿{Number(perf.spend ?? 0).toLocaleString()}
                          {campaign.totalBudget != null && Number(campaign.totalBudget) > 0 ? (
                            <span> / ฿{Number(campaign.totalBudget).toLocaleString()}</span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />{totalImpressions.toLocaleString()} impr.
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />{totalClicks.toLocaleString()} clicks
                        </span>
                        {totalImpressions > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />CTR: {((totalClicks / totalImpressions) * 100).toFixed(2)}%
                          </span>
                        )}
                        <span>{campaign.adSets.length} ad set{campaign.adSets.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isFbCampaign && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="ดึงข้อมูล Facebook Insights"
                          onClick={(e) => { e.stopPropagation(); handleRefreshInsights(campaign.id) }}
                          disabled={refreshingInsights === campaign.id}
                        >
                          {refreshingInsights === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BarChart3 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(campaign, "ACTIVE")}>
                              <Play className="mr-2 h-3.5 w-3.5" />เปิดใช้งาน
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "ACTIVE" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(campaign, "PAUSED")}>
                              <Pause className="mr-2 h-3.5 w-3.5" />หยุดชั่วคราว
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "PAUSED" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(campaign, "ACTIVE")}>
                              <Play className="mr-2 h-3.5 w-3.5" />เปิดใช้งานต่อ
                            </DropdownMenuItem>
                          )}
                          {isFbCampaign && (
                            <DropdownMenuItem onClick={() => handleRefreshInsights(campaign.id)}>
                              <BarChart3 className="mr-2 h-3.5 w-3.5" />อัปเดต Insights
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(campaign.id)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />ลบ
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
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>ก่อนหน้า</Button>
              <span className="text-sm text-muted-foreground">หน้า {page} จาก {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>ถัดไป</Button>
            </div>
          )}
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={!!disconnectId} onOpenChange={() => setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยกเลิกการเชื่อมต่อ Facebook Ad Account?</AlertDialogTitle>
            <AlertDialogDescription>
              การยกเลิกจะทำให้ไม่สามารถ sync แคมเปญจาก Facebook ได้อีก แต่ข้อมูลแคมเปญที่มีอยู่จะยังคงอยู่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ยกเลิกการเชื่อมต่อ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
