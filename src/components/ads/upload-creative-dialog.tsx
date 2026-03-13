"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createCreative } from "@/server/actions/ads-creatives"

type CreativeType = "IMAGE" | "VIDEO" | "CAROUSEL" | "COLLECTION" | "STORY" | "REEL"

interface UploadCreativeDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function UploadCreativeDialog({ open, onClose, onCreated }: UploadCreativeDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<CreativeType>("IMAGE")
  const [tags, setTags] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)

    // Auto-detect type
    if (selected.type.startsWith("video/")) {
      setType("VIDEO")
    } else {
      setType("IMAGE")
    }

    // Auto-fill name if empty
    if (!name) {
      setName(selected.name.replace(/\.[^.]+$/, ""))
    }

    // Preview
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(selected)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!file) {
      toast.error("Please select a file")
      return
    }

    setSaving(true)
    try {
      // In production, this would upload to a storage service.
      // For now, we create the creative with a placeholder URL.
      const fileUrl = preview ?? `/uploads/creatives/${file.name}`
      const dims = preview ? await getImageDimensions(preview) : undefined

      await createCreative({
        name: name.trim(),
        type,
        fileUrl,
        thumbnailUrl: preview ?? undefined,
        dimensions: dims,
        fileSize: file.size,
        mimeType: file.type,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      })
      toast.success("Creative created!")
      resetForm()
      onCreated()
    } catch {
      toast.error("Failed to create creative")
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setName("")
    setType("IMAGE")
    setTags("")
    setFile(null)
    setPreview(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Creative</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <div className="relative w-full">
                <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-md object-contain" />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-0 top-0 h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : file ? (
              <div className="text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1048576).toFixed(1)} MB</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Click to select image or video</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, MP4, MOV up to 50MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Sale Banner" />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CreativeType)}>
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

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sale, summer, product" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !name.trim() || !file}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {saving ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper to get image dimensions from data URL
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = dataUrl
  })
}
