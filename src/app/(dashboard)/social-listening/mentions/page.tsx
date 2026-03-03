"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Globe,
  Search,
  ExternalLink,
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
} from "lucide-react"
import { toast } from "sonner"
import { getMentions } from "@/server/actions/social"
import { getProductsSimple } from "@/server/actions/product"

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
  TIKTOK: Globe,
  PINTEREST: Globe,
}

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: typeof ThumbsUp }> = {
  POSITIVE: { label: "Positive", color: "text-green-600", icon: ThumbsUp },
  NEGATIVE: { label: "Negative", color: "text-red-600", icon: ThumbsDown },
  NEUTRAL: { label: "Neutral", color: "text-gray-600", icon: Minus },
  MIXED: { label: "Mixed", color: "text-yellow-600", icon: BarChart3 },
}

interface MentionItem {
  id: string
  platform: string
  authorName: string | null
  authorHandle: string | null
  content: string
  url: string | null
  sentiment: string | null
  sentimentScore: number | null
  isCompetitor: boolean
  matchedKeyword: string | null
  engagementCount: number
  reachEstimate: number | null
  mentionedAt: string | Date
}

interface SimpleProduct { id: string; name: string; category: string | null; marketingDataScore: number }

export default function MentionsPage() {
  const [mentions, setMentions] = useState<MentionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [platform, setPlatform] = useState("all")
  const [sentiment, setSentiment] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [pagination, setPagination] = useState({ page: 1, perPage: 20, total: 0, totalPages: 0 })

  useEffect(() => {
    getProductsSimple().then((p) => setProducts(p as unknown as SimpleProduct[])).catch(() => {})
  }, [])

  const fetchMentions = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getMentions({
        platform: platform === "all" ? undefined : platform,
        sentiment: sentiment === "all" ? undefined : sentiment,
        productId: productFilter === "all" ? undefined : productFilter,
        search: search || undefined,
        page: pagination.page,
        perPage: pagination.perPage,
      })
      setMentions(result.mentions as unknown as MentionItem[])
      setPagination(result.pagination)
    } catch {
      toast.error("Failed to load mentions")
    } finally {
      setIsLoading(false)
    }
  }, [platform, sentiment, productFilter, search, pagination.page, pagination.perPage])

  useEffect(() => { fetchMentions() }, [fetchMentions])

  return (
    <div className="space-y-6">
      <PageHeader heading="All Mentions" description="Brand mentions across all platforms" backHref="/social-listening" />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search mentions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Platform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="TWITTER">Twitter/X</SelectItem>
                <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                <SelectItem value="TIKTOK">TikTok</SelectItem>
                <SelectItem value="YOUTUBE">YouTube</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sentiment} onValueChange={setSentiment}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Sentiment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="POSITIVE">Positive</SelectItem>
                <SelectItem value="NEUTRAL">Neutral</SelectItem>
                <SelectItem value="NEGATIVE">Negative</SelectItem>
                <SelectItem value="MIXED">Mixed</SelectItem>
              </SelectContent>
            </Select>
            {products.length > 0 && (
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="สินค้า" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสินค้า</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mentions List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        </div>
      ) : mentions.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No mentions found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Mentions will appear here when your brand is mentioned online. Connect social accounts to start monitoring.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/settings/integrations">Connect Accounts</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mentions.map((mention) => {
            const PlatformIcon = PLATFORM_ICONS[mention.platform] ?? Globe
            const sentimentInfo = mention.sentiment ? SENTIMENT_CONFIG[mention.sentiment] : null

            return (
              <Card key={mention.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <PlatformIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mention.authorName ?? "Unknown"}</span>
                          {mention.authorHandle && (
                            <span className="text-sm text-muted-foreground">@{mention.authorHandle}</span>
                          )}
                          {mention.isCompetitor && (
                            <Badge variant="destructive" className="text-xs">Competitor</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm">{mention.content}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(mention.mentionedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="capitalize">{mention.platform.toLowerCase()}</span>
                          {mention.engagementCount > 0 && (
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{mention.engagementCount}</span>
                          )}
                          {mention.matchedKeyword && (
                            <Badge variant="outline" className="text-xs">#{mention.matchedKeyword}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {sentimentInfo && (
                        <Badge variant="outline" className={`text-xs ${sentimentInfo.color}`}>
                          <sentimentInfo.icon className="mr-1 h-3 w-3" />
                          {sentimentInfo.label}
                        </Badge>
                      )}
                      {mention.url && (
                        <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(pagination.page - 1) * pagination.perPage + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
