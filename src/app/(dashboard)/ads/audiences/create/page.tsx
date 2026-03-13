"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import {
  AudienceBuilder,
  DEFAULT_TARGETING,
  type TargetingData,
} from "@/components/ads/audience-builder"
import {
  createAudience,
  updateAudience,
  getAudienceById,
} from "@/server/actions/ads-audiences"

const TYPE_OPTIONS = [
  { value: "SAVED", label: "Saved Audience" },
  { value: "CUSTOM", label: "Custom Audience" },
  { value: "LOOKALIKE", label: "Lookalike Audience" },
]

export default function CreateAudiencePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const isEdit = !!editId

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"SAVED" | "CUSTOM" | "LOOKALIKE">("SAVED")
  const [targeting, setTargeting] = useState<TargetingData>(DEFAULT_TARGETING)

  useEffect(() => {
    if (!editId) return
    const load = async () => {
      try {
        const audience = await getAudienceById(editId)
        if (!audience) {
          toast.error("ไม่พบ Audience")
          router.push("/ads/audiences")
          return
        }
        setName(audience.name)
        setDescription(audience.description ?? "")
        setType(audience.type as "SAVED" | "CUSTOM" | "LOOKALIKE")
        setTargeting({
          ...DEFAULT_TARGETING,
          ...(audience.targeting as Partial<TargetingData>),
        })
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลได้")
        router.push("/ads/audiences")
      } finally {
        setIsFetching(false)
      }
    }
    load()
  }, [editId, router])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("กรุณาใส่ชื่อ Audience")
      return
    }

    setIsLoading(true)
    try {
      if (isEdit && editId) {
        await updateAudience({
          id: editId,
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          targeting,
        })
        toast.success("อัปเดต Audience แล้ว")
      } else {
        await createAudience({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          targeting,
        })
        toast.success("สร้าง Audience แล้ว")
      }
      router.push("/ads/audiences")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading={isEdit ? "Edit Audience" : "Create Audience"}
        description={
          isEdit
            ? "แก้ไขกลุ่มเป้าหมายโฆษณา"
            : "สร้างกลุ่มเป้าหมายใหม่สำหรับแคมเปญโฆษณา"
        }
      >
        <Button variant="outline" asChild>
          <Link href="/ads/audiences">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Young Adults Bangkok"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Audience Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this audience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audience Builder */}
      <AudienceBuilder value={targeting} onChange={setTargeting} />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/ads/audiences">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Audience" : "Save Audience"}
        </Button>
      </div>
    </div>
  )
}
