"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Eye,
  Pencil,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Video,
  MousePointerClick,
  TrendingUp,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getCreatives, deleteCreative } from "@/server/actions/ads-creatives"
import { CreativePreview } from "@/components/ads/creative-preview"
import { UploadCreativeDialog } from "@/components/ads/upload-creative-dialog"

// ─── Types ──────────────────────────────────────────────────

type CreativeType = "IMAGE" | "VIDEO" | "CAROUSEL" | "COLLECTION" | "STORY" | "REEL"

interface AdCreative {
  id: string
  name: string
  type: CreativeType
  fileUrl: string
  thumbnailUrl: string | null
  dimensions: { width: number; height: number } | null
  fileSize: number | null
  mimeType: string | null
  performance: Record<string, number> | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ─── Constants ──────────────────────────────────────────────

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
  { value: "CAROUSEL", label: "Carousel" },
  { value: "COLLECTION", label: "Collection" },
  { value: "STORY", label: "Story" },
  { value: "REEL", label: "Reel" },
]

const typeConfig: Record<string, { label: string; icon: typeof ImageIcon; variant: "default" | "secondary" | "outline" }> = {
  IMAGE: { label: "Image", icon: ImageIcon, variant: "default" },
  VIDEO: { label: "Video", icon: Video, variant: "secondary" },
  CAROUSEL: { label: "Carousel", icon: LayoutGrid, variant: "outline" },
  COLLECTION: { label: "Collection", icon: LayoutGrid, variant: "outline" },
  STORY: { label: "Story", icon: Video, variant: "secondary" },
  REEL: { label: "Reel", icon: Video, variant: "secondary" },
}

// ─── Component ──────────────────────────────────────────────

export default function CreativesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [creatives, setCreatives] = useState<AdCreative[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewCreative, setPreviewCreative] = useState<AdCreative | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const result = await getCreatives({
        search: search || undefined,
        type: typeFilter !== "all" ? (typeFilter as CreativeType) : undefined,
        page,
        perPage: 20,
      })
      setCreatives(result.creatives as unknown as AdCreative[])
      setTotalPages(result.pagination.totalPages)
    } catch {
      toast.error("Failed to load creatives")
    } finally {
      setIsLoading(false)
    }
  }, [search, typeFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCreative(deleteId)
      toast.success("Creative deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete creative")
    } finally {
      setDeleteId(null)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Creative Library" description="Manage images and videos for your ad campaigns">
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />Upload Creative
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or tags..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {creatives.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No creatives yet"
          description="Upload your first creative to start building ad campaigns"
        >
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Upload Creative
          </Button>
        </EmptyState>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {creatives.map((creative) => {
            const cfg = typeConfig[creative.type] ?? { label: creative.type, icon: ImageIcon, variant: "outline" as const }
            const perf = creative.performance ?? {}
            const TypeIcon = cfg.icon
            return (
              <Card
                key={creative.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-md"
                onClick={() => setPreviewCreative(creative)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {creative.thumbnailUrl || creative.fileUrl ? (
                    <img
                      src={creative.thumbnailUrl ?? creative.fileUrl}
                      alt={creative.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <TypeIcon className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  {/* Overlay actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setPreviewCreative(creative) }}>
                      <Eye className="mr-1 h-3.5 w-3.5" />View
                    </Button>
                  </div>
                  {/* Type badge */}
                  <Badge variant={cfg.variant} className="absolute left-2 top-2 gap-1">
                    <TypeIcon className="h-3 w-3" />{cfg.label}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{creative.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(creative.fileSize)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewCreative(creative) }}>
                          <Eye className="mr-2 h-3.5 w-3.5" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewCreative(creative) }}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(creative.id) }}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Mini stats */}
                  {(perf.impressions || perf.clicks) ? (
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{Number(perf.impressions ?? 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{Number(perf.clicks ?? 0).toLocaleString()}</span>
                      {perf.ctr != null && (
                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{Number(perf.ctr).toFixed(1)}%</span>
                      )}
                    </div>
                  ) : null}
                  {/* Tags */}
                  {creative.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {creative.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                      {creative.tags.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{creative.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {creatives.map((creative) => {
            const cfg = typeConfig[creative.type] ?? { label: creative.type, icon: ImageIcon, variant: "outline" as const }
            const perf = creative.performance ?? {}
            const TypeIcon = cfg.icon
            return (
              <Card
                key={creative.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setPreviewCreative(creative)}
              >
                <CardContent className="flex items-center gap-4 py-3">
                  {/* Thumbnail */}
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {creative.thumbnailUrl || creative.fileUrl ? (
                      <img src={creative.thumbnailUrl ?? creative.fileUrl} alt={creative.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><TypeIcon className="h-6 w-6 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{creative.name}</p>
                      <Badge variant={cfg.variant} className="gap-1 shrink-0"><TypeIcon className="h-3 w-3" />{cfg.label}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(creative.fileSize)}</span>
                      {perf.impressions != null && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{Number(perf.impressions).toLocaleString()} impr.</span>}
                      {perf.clicks != null && <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{Number(perf.clicks).toLocaleString()} clicks</span>}
                      {perf.ctr != null && <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />CTR: {Number(perf.ctr).toFixed(2)}%</span>}
                    </div>
                  </div>
                  {/* Tags */}
                  <div className="hidden gap-1 md:flex">
                    {creative.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewCreative(creative) }}>
                        <Eye className="mr-2 h-3.5 w-3.5" />View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewCreative(creative) }}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(creative.id) }}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* Preview Modal */}
      {previewCreative && (
        <CreativePreview
          creative={previewCreative}
          open={!!previewCreative}
          onClose={() => setPreviewCreative(null)}
          onDelete={(id) => { setPreviewCreative(null); setDeleteId(id) }}
          onUpdated={fetchData}
        />
      )}

      {/* Upload Dialog */}
      <UploadCreativeDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={() => { setUploadOpen(false); fetchData() }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Creative?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The creative will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
