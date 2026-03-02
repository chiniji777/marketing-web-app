"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { getKeywords } from "@/server/actions/seo"

interface RankedKeyword {
  id: string
  keyword: string
  currentRank: number | null
  previousRank: number | null
  searchVolume: number | null
  difficulty: number | null
  targetUrl: string | null
  lastChecked: string | null
}

export default function RankingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [keywords, setKeywords] = useState<RankedKeyword[]>([])

  const fetchData = useCallback(async () => {
    try {
      const result = await getKeywords({ perPage: 100 })
      setKeywords(result.keywords as unknown as RankedKeyword[])
    } catch {
      toast.error("Failed to load rankings")
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
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  const rankedKeywords = keywords.filter((k) => k.currentRank != null)
  const unrankedKeywords = keywords.filter((k) => k.currentRank == null)

  const getRankChange = (current: number | null, previous: number | null) => {
    if (current == null || previous == null) return { change: 0, direction: "none" as const }
    const diff = previous - current // positive = improved (rank decreased)
    if (diff > 0) return { change: diff, direction: "up" as const }
    if (diff < 0) return { change: Math.abs(diff), direction: "down" as const }
    return { change: 0, direction: "none" as const }
  }

  const getDifficultyColor = (d: number) => {
    if (d < 30) return "text-emerald-600"
    if (d < 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getDifficultyLabel = (d: number) => {
    if (d < 30) return "Easy"
    if (d < 60) return "Medium"
    return "Hard"
  }

  const top10 = rankedKeywords.filter((k) => k.currentRank != null && k.currentRank <= 10).length
  const top30 = rankedKeywords.filter((k) => k.currentRank != null && k.currentRank <= 30).length
  const improved = rankedKeywords.filter((k) => {
    const { direction } = getRankChange(k.currentRank, k.previousRank)
    return direction === "up"
  }).length

  return (
    <div className="space-y-6">
      <PageHeader heading="Rankings" description="Track your keyword ranking positions over time" />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Tracked</p>
            <p className="text-2xl font-bold">{keywords.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top 10</p>
            <p className="text-2xl font-bold text-emerald-600">{top10}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Top 30</p>
            <p className="text-2xl font-bold text-blue-600">{top30}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Improved</p>
            <p className="text-2xl font-bold text-emerald-600">{improved}</p>
          </CardContent>
        </Card>
      </div>

      {keywords.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No ranking data"
          description="Add keywords to start tracking rankings"
        />
      ) : (
        <div className="space-y-6">
          {/* Ranked Keywords */}
          {rankedKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranked Keywords ({rankedKeywords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rankedKeywords
                    .sort((a, b) => (a.currentRank ?? 999) - (b.currentRank ?? 999))
                    .map((kw) => {
                      const { change, direction } = getRankChange(kw.currentRank, kw.previousRank)
                      return (
                        <div key={kw.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold">
                              #{kw.currentRank}
                            </div>
                            <div>
                              <p className="font-medium">{kw.keyword}</p>
                              {kw.targetUrl && (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Globe className="h-3 w-3" />{kw.targetUrl}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {kw.difficulty != null && (
                              <span className={`text-xs font-medium ${getDifficultyColor(kw.difficulty)}`}>
                                {getDifficultyLabel(kw.difficulty)} ({kw.difficulty})
                              </span>
                            )}
                            {kw.searchVolume != null && (
                              <Badge variant="outline" className="text-xs">
                                {kw.searchVolume.toLocaleString()} /mo
                              </Badge>
                            )}
                            {direction === "up" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                <ArrowUp className="mr-1 h-3 w-3" />{change}
                              </Badge>
                            ) : direction === "down" ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                <ArrowDown className="mr-1 h-3 w-3" />{change}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Minus className="mr-1 h-3 w-3" />0
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unranked */}
          {unrankedKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Not Yet Ranked ({unrankedKeywords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {unrankedKeywords.map((kw) => (
                    <Badge key={kw.id} variant="outline">{kw.keyword}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
