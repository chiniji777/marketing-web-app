"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { getKeywords, addKeyword, deleteKeyword } from "@/server/actions/seo"

interface Keyword {
  id: string
  keyword: string
  targetUrl: string | null
  currentRank: number | null
  previousRank: number | null
  searchEngine: string
  country: string
  searchVolume: number | null
  createdAt: string
  rankHistory: { id: string; rank: number; checkedAt: string }[]
}

export default function KeywordsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newKeyword, setNewKeyword] = useState({ keyword: "", targetUrl: "" })

  const fetchData = useCallback(async () => {
    try {
      const result = await getKeywords({ search: search || undefined, page, perPage: 30 })
      setKeywords(result.keywords as unknown as Keyword[])
      setTotalPages(result.pagination.totalPages)
    } catch {
      toast.error("Failed to load keywords")
    } finally {
      setIsLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = async () => {
    if (!newKeyword.keyword.trim()) {
      toast.error("Keyword is required")
      return
    }
    try {
      await addKeyword({
        keyword: newKeyword.keyword.trim(),
        targetUrl: newKeyword.targetUrl.trim() || undefined,
        searchEngine: "google",
        country: "US",
        language: "en",
      })
      toast.success("Keyword added")
      setShowAddDialog(false)
      setNewKeyword({ keyword: "", targetUrl: "" })
      fetchData()
    } catch {
      toast.error("Failed to add keyword")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteKeyword(id)
      toast.success("Keyword deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete keyword")
    }
  }

  const getRankChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null
    return previous - current // positive = improved
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Keywords" description="Track keyword rankings and discover opportunities">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Keywords</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Keyword</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Keyword *</Label>
                <Input value={newKeyword.keyword} onChange={(e) => setNewKeyword((p) => ({ ...p, keyword: e.target.value }))} placeholder="e.g., marketing automation" />
              </div>
              <div className="space-y-2">
                <Label>Target URL</Label>
                <Input value={newKeyword.targetUrl} onChange={(e) => setNewKeyword((p) => ({ ...p, targetUrl: e.target.value }))} placeholder="https://yoursite.com/page" />
              </div>
              <Button onClick={handleAdd} className="w-full">Add Keyword</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search keywords..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {keywords.length === 0 ? (
        <EmptyState icon={Search} title="No keywords tracked" description="Add keywords to monitor their search rankings">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Keywords
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-5">Keyword</div>
            <div className="col-span-2 text-center">Current Rank</div>
            <div className="col-span-2 text-center">Change</div>
            <div className="col-span-2 text-center">Volume</div>
            <div className="col-span-1" />
          </div>

          {keywords.map((kw) => {
            const change = getRankChange(kw.currentRank, kw.previousRank)
            return (
              <Card key={kw.id} className="transition-shadow hover:shadow-md">
                <CardContent className="py-4">
                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{kw.keyword}</p>
                          {kw.targetUrl && (
                            <p className="text-xs text-muted-foreground truncate max-w-[250px]">{kw.targetUrl}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      {kw.currentRank ? (
                        <span className="text-lg font-bold">#{kw.currentRank}</span>
                      ) : (
                        <Badge variant="secondary">-</Badge>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      {change !== null ? (
                        <>
                          {change > 0 && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                          {change < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {change === 0 && <Minus className="h-4 w-4 text-muted-foreground" />}
                          <span className={`text-sm font-medium ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                            {change > 0 ? `+${change}` : change === 0 ? "0" : String(change)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center text-sm text-muted-foreground">
                      {kw.searchVolume ? kw.searchVolume.toLocaleString() : "-"}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(kw.id)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
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
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
