"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  Youtube,
  Plug,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import {
  getSocialAccounts,
  connectSocialAccount,
  disconnectSocialAccount,
  deleteSocialAccount,
} from "@/server/actions/social"

type OAuthMethod = "facebook_oauth" | "facebook_instagram_oauth" | "manual"

interface PlatformConfigItem {
  platform: "FACEBOOK" | "INSTAGRAM" | "TWITTER" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "PINTEREST"
  name: string
  icon: typeof Facebook
  color: string
  bgColor: string
  description: string
  oauthMethod: OAuthMethod
  connectHelp: string
}

const PLATFORM_CONFIG: PlatformConfigItem[] = [
  {
    platform: "FACEBOOK",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    description: "Pages, Groups, and Ads management",
    oauthMethod: "facebook_oauth",
    connectHelp: "เชื่อมต่อผ่าน Facebook OAuth — ระบบจะขอสิทธิ์จัดการเพจ, โฆษณา และโพสอัตโนมัติ",
  },
  {
    platform: "INSTAGRAM",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900",
    description: "Feed posts, Stories, and Reels",
    oauthMethod: "facebook_instagram_oauth",
    connectHelp: "Instagram Business ใช้ Facebook Graph API — กดเชื่อมต่อ Facebook แล้วระบบจะตรวจจับ Instagram Business Account ที่เชื่อมกับเพจอัตโนมัติ",
  },
  {
    platform: "TWITTER",
    name: "Twitter / X",
    icon: Twitter,
    color: "text-sky-500",
    bgColor: "bg-sky-100 dark:bg-sky-900",
    description: "Tweets, replies, and analytics",
    oauthMethod: "manual",
    connectHelp: "ต้องใช้ API Key จาก developer.twitter.com → Project → Keys & Tokens → Bearer Token",
  },
  {
    platform: "LINKEDIN",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    description: "Company pages and professional content",
    oauthMethod: "manual",
    connectHelp: "ต้องใช้ Access Token จาก linkedin.com/developers → OAuth 2.0 tools",
  },
  {
    platform: "TIKTOK",
    name: "TikTok",
    icon: Globe,
    color: "text-black dark:text-white",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    description: "Short-form video content",
    oauthMethod: "manual",
    connectHelp: "TikTok API รองรับเฉพาะวิดีโอ — ต้องใช้ Access Token จาก developers.tiktok.com",
  },
  {
    platform: "YOUTUBE",
    name: "YouTube",
    icon: Youtube,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900",
    description: "Video content and channel management",
    oauthMethod: "manual",
    connectHelp: "YouTube API รองรับเฉพาะวิดีโอ — ต้องใช้ OAuth Token จาก Google Cloud Console",
  },
  {
    platform: "PINTEREST",
    name: "Pinterest",
    icon: Globe,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900",
    description: "Pins and board management",
    oauthMethod: "manual",
    connectHelp: "ต้องใช้ Access Token จาก developers.pinterest.com — ต้องมีรูปภาพเสมอ",
  },
]

interface SocialAccountItem {
  id: string
  platform: string
  platformAccountId: string
  accountName: string
  isActive: boolean
  tokenExpiresAt: string | null
  createdAt: string | Date
}

export default function IntegrationsSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <IntegrationsInner />
    </Suspense>
  )
}

function IntegrationsInner() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectDialog, setConnectDialog] = useState<PlatformConfigItem | null>(null)
  const [connectForm, setConnectForm] = useState({ accountName: "", accountId: "", accessToken: "" })
  const [isConnecting, setIsConnecting] = useState(false)

  const fetchAccounts = useCallback(async () => {
    try {
      const result = await getSocialAccounts()
      setAccounts(result as unknown as SocialAccountItem[])
    } catch {
      toast.error("Failed to load accounts")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  // Handle OAuth callback params
  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")
    const igCount = searchParams.get("instagram")
    const pagesCount = searchParams.get("pages")

    if (connected === "facebook") {
      const parts = []
      parts.push("เชื่อมต่อ Facebook สำเร็จ!")
      if (pagesCount && parseInt(pagesCount) > 0) parts.push(`พบ ${pagesCount} เพจ`)
      if (igCount && parseInt(igCount) > 0) parts.push(`พบ ${igCount} Instagram Business`)
      toast.success(parts.join(" — "))
      fetchAccounts()
      // Clean URL params
      window.history.replaceState({}, "", "/settings/integrations")
    } else if (error) {
      toast.error(`เชื่อมต่อไม่สำเร็จ: ${decodeURIComponent(error)}`)
      window.history.replaceState({}, "", "/settings/integrations")
    }
  }, [searchParams, fetchAccounts])

  const handleFacebookOAuth = () => {
    // Redirect to Facebook OAuth flow — will come back to this page
    window.location.href = "/api/facebook/auth?returnTo=/settings/integrations"
  }

  const handleManualConnect = async () => {
    if (!connectDialog || !connectForm.accountName || !connectForm.accessToken) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น")
      return
    }
    setIsConnecting(true)
    try {
      await connectSocialAccount({
        platform: connectDialog.platform,
        platformAccountId: connectForm.accountId || connectForm.accountName.toLowerCase().replace(/\s+/g, "_"),
        accountName: connectForm.accountName,
        accessToken: connectForm.accessToken,
      })
      toast.success(`เชื่อมต่อ ${connectDialog.name} สำเร็จ`)
      setConnectDialog(null)
      setConnectForm({ accountName: "", accountId: "", accessToken: "" })
      fetchAccounts()
    } catch {
      toast.error("เชื่อมต่อไม่สำเร็จ")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    try {
      await disconnectSocialAccount(id)
      toast.success("ยกเลิกการเชื่อมต่อแล้ว")
      fetchAccounts()
    } catch {
      toast.error("Failed to disconnect account")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSocialAccount(id)
      toast.success("ลบบัญชีแล้ว")
      fetchAccounts()
    } catch {
      toast.error("Failed to remove account")
    }
  }

  const handleConnectClick = (config: PlatformConfigItem) => {
    if (config.oauthMethod === "facebook_oauth" || config.oauthMethod === "facebook_instagram_oauth") {
      handleFacebookOAuth()
    } else {
      setConnectDialog(config)
      setConnectForm({ accountName: "", accountId: "", accessToken: "" })
    }
  }

  const getConnectedAccounts = (platform: string) => accounts.filter((a) => a.platform === platform)

  return (
    <div className="space-y-6">
      <PageHeader heading="เชื่อมต่อบัญชี" description="เชื่อมต่อบัญชี Social Media เพื่อโพสอัตโนมัติและ Social Listening" backHref="/settings" />

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4" />
            บัญชีที่เชื่อมต่อแล้ว
          </CardTitle>
          <CardDescription>
            {accounts.filter((a) => a.isActive).length} บัญชีที่เชื่อมต่ออยู่
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plug className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                ยังไม่ได้เชื่อมต่อบัญชี — เลือกแพลตฟอร์มด้านล่างเพื่อเริ่มต้น
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const config = PLATFORM_CONFIG.find((p) => p.platform === account.platform)
                const Icon = config?.icon ?? Globe
                const isExpired = account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()
                const daysLeft = account.tokenExpiresAt
                  ? Math.ceil((new Date(account.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null
                return (
                  <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config?.bgColor ?? "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${config?.color ?? ""}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.accountName}</p>
                          {account.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {config?.name ?? account.platform}
                          </p>
                          {isExpired ? (
                            <Badge variant="destructive" className="text-xs">Token หมดอายุ</Badge>
                          ) : daysLeft !== null && daysLeft <= 7 ? (
                            <Badge variant="outline" className="text-xs text-orange-600">
                              เหลือ {daysLeft} วัน
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired && (config?.oauthMethod === "facebook_oauth" || config?.oauthMethod === "facebook_instagram_oauth") && (
                        <Button variant="outline" size="sm" onClick={handleFacebookOAuth}>
                          <RefreshCw className="mr-1 h-3 w-3" />
                          ต่ออายุ
                        </Button>
                      )}
                      <Switch
                        checked={account.isActive}
                        onCheckedChange={() =>
                          account.isActive ? handleDisconnect(account.id) : fetchAccounts()
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Available Platforms */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">แพลตฟอร์มที่รองรับ</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_CONFIG.map((config) => {
            const connected = getConnectedAccounts(config.platform)
            const Icon = config.icon
            const isOAuth = config.oauthMethod === "facebook_oauth" || config.oauthMethod === "facebook_instagram_oauth"
            return (
              <Card key={config.platform}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{config.name}</CardTitle>
                        <CardDescription className="text-xs">{config.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOAuth && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          OAuth
                        </Badge>
                      )}
                      {connected.length > 0 && (
                        <Badge variant="secondary">{connected.length}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {connected.length > 0 ? (
                    <div className="space-y-2">
                      {connected.map((acc) => (
                        <div key={acc.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{acc.accountName}</span>
                          <Badge variant={acc.isActive ? "default" : "secondary"} className="text-xs">
                            {acc.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handleConnectClick(config)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        {isOAuth ? "เชื่อมต่อเพิ่ม" : "เพิ่มบัญชี"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{config.connectHelp}</p>
                      <Button
                        variant={isOAuth ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleConnectClick(config)}
                      >
                        {isOAuth ? (
                          <>
                            <ExternalLink className="mr-2 h-3 w-3" />
                            เชื่อมต่อด้วย Facebook
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3" />
                            เชื่อมต่อ (Manual)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* How it works */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-600" />
            วิธีการเชื่อมต่อ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5 shrink-0 text-xs text-green-600 border-green-300">OAuth</Badge>
            <p><strong>Facebook / Instagram</strong> — กดเชื่อมต่อ → ล็อกอิน Facebook → อนุญาตสิทธิ์ → ระบบจะเชื่อมต่อเพจ Facebook + ตรวจจับ Instagram Business ที่ผูกกับเพจอัตโนมัติ (Token อายุ 60 วัน)</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">Manual</Badge>
            <p><strong>Twitter, LinkedIn, Pinterest</strong> — ต้องใช้ Access Token จาก Developer Portal ของแต่ละแพลตฟอร์ม (คัดลอก token มาวาง)</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <p><strong>TikTok, YouTube</strong> — รองรับเฉพาะวิดีโอ ยังไม่สามารถโพส text/image ผ่าน API ได้</p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Connect Dialog — for non-OAuth platforms */}
      <Dialog open={!!connectDialog} onOpenChange={() => setConnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เชื่อมต่อ {connectDialog?.name}</DialogTitle>
            <DialogDescription>{connectDialog?.connectHelp}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="acc-name">ชื่อบัญชี *</Label>
              <Input
                id="acc-name"
                placeholder="เช่น หน้าเพจธุรกิจ, @username"
                value={connectForm.accountName}
                onChange={(e) => setConnectForm((prev) => ({ ...prev, accountName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-id">Platform Account ID (ไม่บังคับ)</Label>
              <Input
                id="acc-id"
                placeholder="เช่น 123456789"
                value={connectForm.accountId}
                onChange={(e) => setConnectForm((prev) => ({ ...prev, accountId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">ถ้าไม่กรอก ระบบจะสร้างให้อัตโนมัติ</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-token">Access Token *</Label>
              <Input
                id="acc-token"
                type="password"
                placeholder="วาง access token ที่นี่"
                value={connectForm.accessToken}
                onChange={(e) => setConnectForm((prev) => ({ ...prev, accessToken: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ดู token ได้จาก Developer Portal ของแต่ละแพลตฟอร์ม
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)}>ยกเลิก</Button>
            <Button onClick={handleManualConnect} disabled={isConnecting || !connectForm.accountName || !connectForm.accessToken}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              เชื่อมต่อ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
