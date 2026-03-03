"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Sparkles,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { getMentionStats } from "@/server/actions/social"
import { useAIAssist } from "@/hooks/use-ai-assist"

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
  TIKTOK: Globe,
}

interface Stats {
  total: number
  sentiment: { positive: number; negative: number; neutral: number; mixed: number }
  platformCounts: Array<{ platform: string; count: number }>
}

export default function SentimentPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const ai = useAIAssist()
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const result = await getMentionStats()
      setStats(result as unknown as Stats)
    } catch {
      toast.error("Failed to load sentiment data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const sentimentTotal = stats
    ? stats.sentiment.positive + stats.sentiment.negative + stats.sentiment.neutral + stats.sentiment.mixed
    : 0

  const getPercent = (value: number) =>
    sentimentTotal > 0 ? Math.round((value / sentimentTotal) * 100) : 0

  const handleAIAnalysis = async () => {
    if (!stats) return
    const summaryText = [
      `Total mentions: ${sentimentTotal}`,
      `Positive: ${stats.sentiment.positive} (${getPercent(stats.sentiment.positive)}%)`,
      `Neutral: ${stats.sentiment.neutral} (${getPercent(stats.sentiment.neutral)}%)`,
      `Negative: ${stats.sentiment.negative} (${getPercent(stats.sentiment.negative)}%)`,
      `Mixed: ${stats.sentiment.mixed} (${getPercent(stats.sentiment.mixed)}%)`,
      `Platforms: ${stats.platformCounts.map((p) => `${p.platform.toLowerCase()}: ${p.count}`).join(", ")}`,
    ].join("\n")

    const result = await ai.generate("improve_text", {
      text: summaryText,
      purpose: "analyze social media sentiment data and provide actionable insights",
    })
    if (result) {
      setAiAnalysis(result)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Sentiment Analysis" description="AI-powered sentiment analysis of brand mentions" backHref="/social-listening">
        {stats && sentimentTotal > 0 && (
          <Button variant="outline" onClick={handleAIAnalysis} disabled={ai.isLoading}>
            {ai.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            AI วิเคราะห์ Sentiment
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><div className="h-20 animate-pulse rounded bg-muted" /></CardContent></Card>
          ))}
        </div>
      ) : !stats || sentimentTotal === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No sentiment data yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Sentiment analysis will be available once mentions are collected. AI automatically analyzes the sentiment of each mention.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sentiment Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getPercent(stats.sentiment.positive)}%</p>
                    <p className="text-xs text-muted-foreground">Positive ({stats.sentiment.positive})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Minus className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getPercent(stats.sentiment.neutral)}%</p>
                    <p className="text-xs text-muted-foreground">Neutral ({stats.sentiment.neutral})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                    <ThumbsDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getPercent(stats.sentiment.negative)}%</p>
                    <p className="text-xs text-muted-foreground">Negative ({stats.sentiment.negative})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                    <BarChart3 className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getPercent(stats.sentiment.mixed)}%</p>
                    <p className="text-xs text-muted-foreground">Mixed ({stats.sentiment.mixed})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sentiment Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-8 overflow-hidden rounded-full">
                {stats.sentiment.positive > 0 && (
                  <div className="bg-green-500" style={{ width: `${getPercent(stats.sentiment.positive)}%` }} title={`Positive: ${getPercent(stats.sentiment.positive)}%`} />
                )}
                {stats.sentiment.neutral > 0 && (
                  <div className="bg-gray-400" style={{ width: `${getPercent(stats.sentiment.neutral)}%` }} title={`Neutral: ${getPercent(stats.sentiment.neutral)}%`} />
                )}
                {stats.sentiment.mixed > 0 && (
                  <div className="bg-yellow-400" style={{ width: `${getPercent(stats.sentiment.mixed)}%` }} title={`Mixed: ${getPercent(stats.sentiment.mixed)}%`} />
                )}
                {stats.sentiment.negative > 0 && (
                  <div className="bg-red-500" style={{ width: `${getPercent(stats.sentiment.negative)}%` }} title={`Negative: ${getPercent(stats.sentiment.negative)}%`} />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {[
                  { label: "Positive", color: "bg-green-500", value: stats.sentiment.positive },
                  { label: "Neutral", color: "bg-gray-400", value: stats.sentiment.neutral },
                  { label: "Mixed", color: "bg-yellow-400", value: stats.sentiment.mixed },
                  { label: "Negative", color: "bg-red-500", value: stats.sentiment.negative },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span>{item.label}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Sentiment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mentions by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.platformCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No platform data available</p>
              ) : (
                <div className="space-y-4">
                  {stats.platformCounts
                    .sort((a, b) => b.count - a.count)
                    .map((item) => {
                      const PlatformIcon = PLATFORM_ICONS[item.platform] ?? Globe
                      const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
                      return (
                        <div key={item.platform} className="flex items-center gap-4">
                          <div className="flex w-28 items-center gap-2">
                            <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{item.platform.toLowerCase()}</span>
                          </div>
                          <div className="flex-1">
                            <div className="h-3 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="flex w-20 items-center justify-end gap-1 text-sm">
                            <span className="font-medium">{item.count}</span>
                            <span className="text-xs text-muted-foreground">({pct}%)</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.sentiment.positive > stats.sentiment.negative ? (
                <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                  <TrendingUp className="mt-0.5 h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Positive sentiment dominates</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {getPercent(stats.sentiment.positive)}% of mentions are positive — your brand perception is strong.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                  <TrendingDown className="mt-0.5 h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Negative sentiment alert</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Negative mentions ({stats.sentiment.negative}) exceed positive ({stats.sentiment.positive}). Review recent negative mentions.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-lg bg-muted p-3">
                <BarChart3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    {sentimentTotal} mentions analyzed across {stats.platformCounts.length} platforms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Result */}
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI วิเคราะห์ Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
