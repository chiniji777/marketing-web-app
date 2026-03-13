"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
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
import { Users, Plus, Search, MoreHorizontal, Trash2, Pencil, Copy } from "lucide-react"
import { toast } from "sonner"
import { getAudiences, deleteAudience, createAudience } from "@/server/actions/ads-audiences"
import type { CreateAudienceInput } from "@/server/actions/ads-audiences"

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "SAVED", label: "Saved" },
  { value: "CUSTOM", label: "Custom" },
  { value: "LOOKALIKE", label: "Lookalike" },
]

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  SAVED: { label: "Saved", variant: "default" },
  CUSTOM: { label: "Custom", variant: "secondary" },
  LOOKALIKE: { label: "Lookalike", variant: "outline" },
}

interface Audience {
  id: string
  name: string
  description: string | null
  type: string
  estimatedSize: number | null
  targeting: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export default function AudiencesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const result = await getAudiences({
        search: search || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        page,
        perPage: 20,
      })
      setAudiences(result.audiences as unknown as Audience[])
      setTotalPages(result.pagination.totalPages)
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูล Audiences ได้")
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
      await deleteAudience(deleteId)
      toast.success("ลบ Audience แล้ว")
      fetchData()
    } catch {
      toast.error("ไม่สามารถลบ Audience ได้")
    } finally {
      setDeleteId(null)
    }
  }

  const handleDuplicate = async (audience: Audience) => {
    try {
      await createAudience({
        name: `${audience.name} (Copy)`,
        description: audience.description ?? undefined,
        targeting: audience.targeting,
        type: audience.type as CreateAudienceInput["type"],
      })
      toast.success("Duplicate Audience แล้ว")
      fetchData()
    } catch {
      toast.error("ไม่สามารถ duplicate ได้")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Saved Audiences" description="จัดการกลุ่มเป้าหมายโฆษณาของคุณ">
        <Button asChild>
          <Link href="/ads/audiences/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Audience
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหา audience..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
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
        </CardContent>
      </Card>

      {/* Audiences List */}
      {audiences.length === 0 ? (
        <EmptyState
          icon={Users}
          title="ยังไม่มี Saved Audiences"
          description="สร้างกลุ่มเป้าหมายเพื่อใช้ซ้ำในแคมเปญโฆษณาของคุณ"
        >
          <Button asChild>
            <Link href="/ads/audiences/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Audience
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {audiences.map((audience) => {
            const cfg = typeBadge[audience.type] ?? {
              label: audience.type,
              variant: "outline" as const,
            }
            return (
              <Card key={audience.id} className="transition-colors hover:bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{audience.name}</span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      {audience.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {audience.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {audience.estimatedSize
                            ? audience.estimatedSize.toLocaleString()
                            : "—"}{" "}
                          reach
                        </span>
                        <span>
                          Created{" "}
                          {new Date(audience.createdAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/ads/audiences/create?edit=${audience.id}`)
                          }
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(audience)}>
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(audience.id)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="text-sm text-muted-foreground">
                หน้า {page} จาก {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Audience นี้?</AlertDialogTitle>
            <AlertDialogDescription>
              การลบจะไม่สามารถกู้คืนได้ แต่แคมเปญที่ใช้ audience นี้จะไม่ได้รับผลกระทบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
