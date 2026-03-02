"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "lucide-react"
import { toast } from "sonner"
import {
  getSocialAccounts,
  connectSocialAccount,
  disconnectSocialAccount,
  deleteSocialAccount,
} from "@/server/actions/social"

const PLATFORM_CONFIG = [
  { platform: "FACEBOOK" as const, name: "Facebook", icon: Facebook, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900", description: "Pages, Groups, and Ads management" },
  { platform: "INSTAGRAM" as const, name: "Instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-100 dark:bg-pink-900", description: "Feed posts, Stories, and Reels" },
  { platform: "TWITTER" as const, name: "Twitter / X", icon: Twitter, color: "text-sky-500", bgColor: "bg-sky-100 dark:bg-sky-900", description: "Tweets, replies, and analytics" },
  { platform: "LINKEDIN" as const, name: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900", description: "Company pages and professional content" },
  { platform: "TIKTOK" as const, name: "TikTok", icon: Globe, color: "text-black dark:text-white", bgColor: "bg-gray-100 dark:bg-gray-800", description: "Short-form video content" },
  { platform: "YOUTUBE" as const, name: "YouTube", icon: Youtube, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900", description: "Video content and channel management" },
  { platform: "PINTEREST" as const, name: "Pinterest", icon: Globe, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900", description: "Pins and board management" },
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
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectDialog, setConnectDialog] = useState<typeof PLATFORM_CONFIG[number] | null>(null)
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

  const handleConnect = async () => {
    if (!connectDialog || !connectForm.accountName || !connectForm.accessToken) {
      toast.error("Please fill in all required fields")
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
      toast.success(`${connectDialog.name} connected successfully`)
      setConnectDialog(null)
      setConnectForm({ accountName: "", accountId: "", accessToken: "" })
      fetchAccounts()
    } catch {
      toast.error("Failed to connect account")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    try {
      await disconnectSocialAccount(id)
      toast.success("Account disconnected")
      fetchAccounts()
    } catch {
      toast.error("Failed to disconnect account")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSocialAccount(id)
      toast.success("Account removed")
      fetchAccounts()
    } catch {
      toast.error("Failed to remove account")
    }
  }

  const getConnectedAccounts = (platform: string) => accounts.filter((a) => a.platform === platform)

  return (
    <div className="space-y-6">
      <PageHeader heading="Integrations" description="Connect your social media accounts and third-party services" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4" />
            Connected Accounts
          </CardTitle>
          <CardDescription>{accounts.filter((a) => a.isActive).length} active connections</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No accounts connected yet. Choose a platform below to get started.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const config = PLATFORM_CONFIG.find((p) => p.platform === account.platform)
                const Icon = config?.icon ?? Globe
                const isExpired = account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()
                return (
                  <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config?.bgColor ?? "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${config?.color ?? ""}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.accountName}</p>
                          {account.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config?.name ?? account.platform}
                          {isExpired && <Badge variant="destructive" className="ml-2 text-xs">Token Expired</Badge>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={account.isActive} onCheckedChange={() => account.isActive ? handleDisconnect(account.id) : fetchAccounts()} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(account.id)}>
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

      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Platforms</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_CONFIG.map((config) => {
            const connected = getConnectedAccounts(config.platform)
            const Icon = config.icon
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
                    {connected.length > 0 && <Badge variant="secondary">{connected.length}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  {connected.length > 0 ? (
                    <div className="space-y-2">
                      {connected.map((acc) => (
                        <div key={acc.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{acc.accountName}</span>
                          <Badge variant={acc.isActive ? "default" : "secondary"} className="text-xs">{acc.isActive ? "Active" : "Inactive"}</Badge>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setConnectDialog(config)}>
                        <Plus className="mr-2 h-3 w-3" />Add Another
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setConnectDialog(config)}>
                      <RefreshCw className="mr-2 h-3 w-3" />Connect
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={!!connectDialog} onOpenChange={() => setConnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {connectDialog?.name}</DialogTitle>
            <DialogDescription>Enter your {connectDialog?.name} account credentials. In production, this would use OAuth 2.0.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="acc-name">Account Name *</Label>
              <Input id="acc-name" placeholder="e.g., My Business Page" value={connectForm.accountName} onChange={(e) => setConnectForm((prev) => ({ ...prev, accountName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-id">Platform Account ID</Label>
              <Input id="acc-id" placeholder="e.g., 123456789" value={connectForm.accountId} onChange={(e) => setConnectForm((prev) => ({ ...prev, accountId: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-token">Access Token *</Label>
              <Input id="acc-token" type="password" placeholder="Enter access token" value={connectForm.accessToken} onChange={(e) => setConnectForm((prev) => ({ ...prev, accessToken: e.target.value }))} />
              <p className="text-xs text-muted-foreground">In production, obtained via OAuth automatically.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
