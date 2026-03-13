"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  Trash2,
  Pencil,
  Save,
  X,
  Image as ImageIcon,
  Video,
  Smartphone,
  Monitor,
} from "lucide-react"
import { toast } from "sonner"
import { updateCreative } from "@/server/actions/ads-creatives"

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

interface CreativePreviewProps {
  creative: AdCreative
  open: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onUpdated: () => void
}

export function CreativePreview({ creative, open, onClose, onDelete, onUpdated }: CreativePreviewProps) {
  const [previewMode, setPreviewMode] = useState<"feed" | "story">("feed")
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(creative.name)
  const [editType, setEditType] = useState<CreativeType>(creative.type)
  const [editTags, setEditTags] = useState(creative.tags.join(", "))
  const [saving, setSaving] = useState(false)

  const perf = creative.performance ?? {}
  const isVideo = creative.type === "VIDEO" || creative.type === "STORY" || creative.type === "REEL"

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateCreative(creative.id, {
        name: editName,
        type: editType,
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      })
      toast.success("Creative updated")
      setIsEditing(false)
      onUpdated()
    } catch {
      toast.error("Failed to update creative")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Edit Creative" : creative.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Preview Section */}
          <div className="space-y-3">
            {/* Preview Mode Toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={previewMode === "feed" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 gap-1 rounded-r-none"
                onClick={() => setPreviewMode("feed")}
              >
                <Monitor className="h-3.5 w-3.5" />Feed
              </Button>
              <Button
                variant={previewMode === "story" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 gap-1 rounded-l-none"
                onClick={() => setPreviewMode("story")}
              >
                <Smartphone className="h-3.5 w-3.5" />Story
              </Button>
            </div>

            {/* Preview */}
            <div
              className={`overflow-hidden rounded-lg bg-muted ${
                previewMode === "story" ? "aspect-[9/16] max-h-[400px] mx-auto w-[225px]" : "aspect-video"
              }`}
            >
              {isVideo ? (
                <video
                  src={creative.fileUrl}
                  poster={creative.thumbnailUrl ?? undefined}
                  controls
                  className="h-full w-full object-cover"
                />
              ) : creative.thumbnailUrl || creative.fileUrl ? (
                <img
                  src={creative.thumbnailUrl ?? creative.fileUrl}
                  alt={creative.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editType} onValueChange={(v) => setEditType(v as CreativeType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="CAROUSEL">Carousel</SelectItem>
                      <SelectItem value="COLLECTION">Collection</SelectItem>
                      <SelectItem value="STORY">Story</SelectItem>
                      <SelectItem value="REEL">Reel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="sale, summer, product" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="mr-2 h-4 w-4" />Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                {/* Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>{creative.type}</Badge>
                    {creative.mimeType && <span className="text-xs text-muted-foreground">{creative.mimeType}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dimensions</span>
                      <p className="font-medium">
                        {creative.dimensions ? `${creative.dimensions.width} × ${creative.dimensions.height}` : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File Size</span>
                      <p className="font-medium">{formatFileSize(creative.fileSize)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <p className="font-medium">{new Date(creative.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated</span>
                      <p className="font-medium">{new Date(creative.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {creative.tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Tags</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {creative.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance */}
                {(perf.impressions || perf.clicks || perf.spend) ? (
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-sm font-medium">Performance</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Impressions</p>
                          <p className="font-medium">{Number(perf.impressions ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Clicks</p>
                          <p className="font-medium">{Number(perf.clicks ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">CTR</p>
                          <p className="font-medium">{Number(perf.ctr ?? 0).toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">CPC</p>
                          <p className="font-medium">฿{Number(perf.cpc ?? 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />Edit
                  </Button>
                  <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(creative.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
