"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Globe,
  TrendingUp,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  BarChart3,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import { getMentionStats } from "@/server/actions/social"
import { getProductsSimple } from "@/server/actions/product"
import { useAIAssist } from "@/hooks/use-ai-assist"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
  TIKTOK: Globe,
  PINTEREST: Globe,
}

const SENTIMENT_CONFIG = {
  POSITIVE: { label: "Positive", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900", icon: ThumbsUp },
  NEGATIVE: { label: "Negative", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900", icon: ThumbsDown },
  NEUTRAL: { label: "Neutral", color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800", icon: Minus },
  MIXED: { label: "Mixed", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900", icon: BarChart3 },
}

interface MentionStats {
  total: number
  sentiment: { positive: number; negative: number; neutral: number; mixed: number }
  recentMentions: Array<{
    id: string
    platform: string
    authorName: string | null
    authorHandle: string | null
    content: string
    url: string | null
    sentiment: string | null
    mentionedAt: string | Date
    engagementCount: number
  }>
  platformCounts: Array<{ platform: string; count: number }>
}

interface SimpleProduct {
  id: string
  name: string
  category: string | null
  marketingDataScore: number
}

export default function SocialListeningPage() {
  const t = useTranslations()
  const [stats, setStats] = useState<MentionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const ai = useAIAssist()
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("all")

  const fetchStats = useCallback(async (productId?: string) => {
    setIsLoading(true)
    try {
      const result = await getMentionStats(productId === "all" ? undefined : productId)
      setStats(result as unknown as MentionStats)
    } catch {
      toast.error("Failed to load stats")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    getProductsSimple().then((p) => setProducts(p as unknown as SimpleProduct[])).catch(() => {})
    fetchStats()
  }, [fetchStats])

  const handleProductChange = (value: string) => {
    setSelectedProductId(value)
    fetchStats(value)
  }

  const handleAIAnalysis = async () => {
    if (!stats) return
    const summaryText = [
      `Total mentions: ${stats.total}`,
      `Positive: ${stats.sentiment.positive}, Negative: ${stats.sentiment.negative}, Neutral: ${stats.sentiment.neutral}, Mixed: ${stats.sentiment.mixed}`,
      `Platforms: ${stats.platformCounts.map((p) => `${p.platform.toLowerCase()}: ${p.count}`).join(", ")}`,
      `Recent mentions: ${stats.recentMentions.slice(0, 5).map((m) => `[${m.sentiment ?? "unknown"}] ${m.content.slice(0, 80)}`).join(" | ")}`,
    ].join("\n")

    const result = await ai.generate("improve_text", {
      text: summaryText,
      purpose: "analyze social media sentiment data and provide actionable insights",
    })
    if (result) {
      setAiInsight(result)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader heading={t.social.title} description={t.social.subtitle} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        </div>
      </div>
    )
  }

  const sentimentTotal = stats
    ? stats.sentiment.positive + stats.sentiment.negative + stats.sentiment.neutral + stats.sentiment.mixed
    : 0
  const positiveRate = sentimentTotal > 0
    ? Math.round((stats!.sentiment.positive / sentimentTotal) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader heading={t.social.title} description={t.social.subtitle}>
        <div className="flex flex-wrap gap-2">
          {products.length > 0 && (
            <Select value={selectedProductId} onValueChange={handleProductChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="เลือกสินค้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสินค้า</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={handleAIAnalysis} disabled={ai.isLoading || !stats}>
            {ai.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI วิเคราะห์
          </Button>
          <Button variant="outline" asChild>
            <Link href="/social-listening/sentiment">Sentiment</Link>
          </Button>
          <Button asChild>
            <Link href="/social-listening/mentions">All Mentions</Link>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t.social.totalMentions} value={stats?.total.toLocaleString() ?? "0"} icon={MessageCircle} description="across all platforms" />
        <StatCard title={t.social.positiveSentiment} value={`${positiveRate}%`} icon={ThumbsUp} change={stats?.sentiment.positive.toString()} changeType="positive" description="positive mentions" />
        <StatCard title={t.social.negativeSentiment} value={stats?.sentiment.negative.toLocaleString() ?? "0"} icon={ThumbsDown} changeType="negative" description="require attention" />
        <StatCard title={t.social.avgSentiment} value={stats?.platformCounts.length.toString() ?? "0"} icon={Globe} description="active sources" />
      </div>

      {/* AI Analysis Result */}
      {aiInsight && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI วิเคราะห์ภาพรวม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiInsight}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Mentions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Recent Mentions
              <Button variant="ghost" size="sm" asChild>
                <Link href="/social-listening/mentions">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats || stats.recentMentions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Globe className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No mentions yet. Connect your social accounts and add tracking keywords to start monitoring.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/settings/integrations">Connect Accounts</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentMentions.map((mention) => {
                  const PlatformIcon = PLATFORM_ICONS[mention.platform] ?? Globe
                  const sentimentInfo = mention.sentiment ? SENTIMENT_CONFIG[mention.sentiment as keyof typeof SENTIMENT_CONFIG] : null

                  return (
                    <div key={mention.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{mention.authorName ?? mention.authorHandle ?? "Unknown"}</span>
                          {mention.authorHandle && (
                            <span className="text-xs text-muted-foreground">@{mention.authorHandle}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {sentimentInfo && (
                            <Badge variant="outline" className={`text-xs ${sentimentInfo.color}`}>
                              {sentimentInfo.label}
                            </Badge>
                          )}
                          {mention.url && (
                            <a href={mention.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="line-clamp-2 text-sm">{mention.content}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(mention.mentionedAt).toLocaleDateString()}</span>
                        {mention.engagementCount > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {mention.engagementCount} engagements
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sentiment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(SENTIMENT_CONFIG).map(([key, config]) => {
                const count = stats?.sentiment[key.toLowerCase() as keyof typeof stats.sentiment] ?? 0
                const pct = sentimentTotal > 0 ? Math.round((count / sentimentTotal) * 100) : 0
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded ${config.bg}`}>
                        <config.icon className={`h-3 w-3 ${config.color}`} />
                      </div>
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats && stats.platformCounts.length > 0 ? (
                stats.platformCounts.map((item) => {
                  const PlatformIcon = PLATFORM_ICONS[item.platform] ?? Globe
                  return (
                    <div key={item.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{item.platform.toLowerCase()}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No platform data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
