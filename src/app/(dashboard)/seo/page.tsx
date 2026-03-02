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
  Search,
  TrendingUp,
  TrendingDown,
  FileSearch,
  ArrowRight,
  Target,
  BarChart3,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import { getSeoStats, getKeywords, getSeoAudits } from "@/server/actions/seo"

interface Stats {
  totalKeywords: number
  totalAudits: number
  avgRank: number
  improved: number
  lastAuditScore: number | null
  lastAuditDate: string | null
}

export default function SeoPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentKeywords, setRecentKeywords] = useState<Array<{
    id: string; keyword: string; currentRank: number | null; previousRank: number | null
  }>>([])
  const [recentAudits, setRecentAudits] = useState<Array<{
    id: string; url: string; score: number | null; createdAt: string
  }>>([])

  const fetchData = useCallback(async () => {
    try {
      const [statsData, kwData, auditsData] = await Promise.all([
        getSeoStats(),
        getKeywords({ perPage: 5 }),
        getSeoAudits(),
      ])
      setStats(statsData as unknown as Stats)
      setRecentKeywords(kwData.keywords as unknown as typeof recentKeywords)
      setRecentAudits((auditsData as unknown as typeof recentAudits).slice(0, 5))
    } catch {
      toast.error("Failed to load SEO data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.seo.title} description={t.seo.subtitle}>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/seo/audit">Site Audit</Link>
          </Button>
          <Button asChild>
            <Link href="/seo/keywords">Keywords</Link>
          </Button>
        </div>
      </PageHeader>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t.seo.keywordsTracked} value={String(stats.totalKeywords)} icon={Search} />
          <StatCard title={t.seo.avgRank} value={stats.avgRank > 0 ? String(stats.avgRank) : "-"} icon={BarChart3} description={t.seo.acrossAllKeywords} />
          <StatCard title={t.seo.improved} value={String(stats.improved)} icon={TrendingUp} changeType="positive" change={t.seo.movedUp} />
          <StatCard title={t.seo.lastAuditScore} value={stats.lastAuditScore ? `${stats.lastAuditScore}/100` : "-"} icon={FileSearch} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Keywords */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.seo.recentKeywords}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seo/keywords">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentKeywords.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No keywords tracked yet</p>
            ) : (
              <div className="space-y-3">
                {recentKeywords.map((kw) => (
                  <div key={kw.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{kw.keyword}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {kw.currentRank ? (
                        <>
                          <span className="text-sm font-bold">#{kw.currentRank}</span>
                          {kw.previousRank && kw.currentRank < kw.previousRank && (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {kw.previousRank && kw.currentRank > kw.previousRank && (
                            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Not ranked</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Audits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t.seo.recentAudits}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seo/audit">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAudits.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t.seo.noAuditsYet}</p>
            ) : (
              <div className="space-y-3">
                {recentAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{audit.url}</p>
                      <p className="text-xs text-muted-foreground">{new Date(audit.createdAt).toLocaleDateString()}</p>
                    </div>
                    {audit.score !== null && (
                      <Badge variant={audit.score >= 80 ? "default" : audit.score >= 60 ? "secondary" : "destructive"}>
                        {audit.score}/100
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
