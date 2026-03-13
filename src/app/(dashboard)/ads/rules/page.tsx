"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Zap,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ScrollText,
  Clock,
  Hash,
} from "lucide-react"
import { toast } from "sonner"
import { getAdRules, toggleAdRule, deleteAdRule } from "@/server/actions/ads-rules"
import {
  conditionToText,
  actionToText,
  type RuleCondition,
  type RuleAction,
} from "@/components/ads/rule-builder"

interface AdRule {
  id: string
  name: string
  description: string | null
  conditions: { conditions: RuleCondition[]; logic: "AND" | "OR" }
  actions: { actions: RuleAction[] }
  isActive: boolean
  lastRunAt: string | null
  runCount: number
  createdAt: string
  _count: { logs: number }
}

export default function RulesPage() {
  const router = useRouter()
  const [rules, setRules] = useState<AdRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      const data = await getAdRules(filterActive !== undefined ? { isActive: filterActive } : undefined)
      setRules(data as unknown as AdRule[])
    } catch {
      toast.error("ไม่สามารถโหลดกฎได้")
    } finally {
      setIsLoading(false)
    }
  }, [filterActive])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleToggle = async (id: string) => {
    try {
      await toggleAdRule(id)
      fetchRules()
      toast.success("อัปเดตสถานะกฎแล้ว")
    } catch {
      toast.error("ไม่สามารถเปลี่ยนสถานะกฎได้")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteAdRule(deleteId)
      toast.success("ลบกฎแล้ว")
      fetchRules()
    } catch {
      toast.error("ไม่สามารถลบกฎได้")
    } finally {
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Auto-Rules"
        description="กฎอัตโนมัติสำหรับจัดการแคมเปญโฆษณา"
        backHref="/ads"
        backLabel="กลับหน้าโฆษณา"
      >
        <Button asChild>
          <Link href="/ads/rules/create">
            <Plus className="mr-2 h-4 w-4" />สร้างกฎ
          </Link>
        </Button>
      </PageHeader>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filterActive === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterActive(undefined)}
        >
          ทั้งหมด
        </Button>
        <Button
          variant={filterActive === true ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterActive(true)}
        >
          เปิดใช้งาน
        </Button>
        <Button
          variant={filterActive === false ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterActive(false)}
        >
          ปิดใช้งาน
        </Button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="ยังไม่มีกฎอัตโนมัติ"
          description="สร้างกฎเพื่อจัดการแคมเปญโฆษณาอัตโนมัติ เช่น หยุดแคมเปญเมื่อ CPA สูงเกินไป"
        >
          <Button asChild>
            <Link href="/ads/rules/create">
              <Plus className="mr-2 h-4 w-4" />สร้างกฎแรก
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const conditions = rule.conditions?.conditions || []
            const actions = rule.actions?.actions || []
            const logic = rule.conditions?.logic || "AND"

            return (
              <Card
                key={rule.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => router.push(`/ads/rules/${rule.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className={`h-4 w-4 ${rule.isActive ? "text-yellow-500" : "text-muted-foreground"}`} />
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "เปิด" : "ปิด"}
                        </Badge>
                      </div>

                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}

                      {/* Conditions summary */}
                      <div className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">ถ้า:</span>
                        {conditions.map((c, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && (
                              <Badge variant="outline" className="text-xs">{logic}</Badge>
                            )}
                            <Badge variant="secondary" className="font-mono text-xs">
                              {conditionToText(c)}
                            </Badge>
                          </span>
                        ))}
                      </div>

                      {/* Actions summary */}
                      <div className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">แล้ว:</span>
                        {actions.map((a, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {actionToText(a)}
                          </Badge>
                        ))}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {rule.lastRunAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            รันล่าสุด: {new Date(rule.lastRunAt).toLocaleString("th-TH")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          รัน {rule.runCount} ครั้ง
                        </span>
                        <span className="flex items-center gap-1">
                          <ScrollText className="h-3 w-3" />
                          {rule._count.logs} logs
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggle(rule.id)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/ads/rules/${rule.id}`)}>
                            <ScrollText className="mr-2 h-3.5 w-3.5" />ดู Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/ads/rules/create?edit=${rule.id}`)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(rule.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกฎอัตโนมัตินี้?</AlertDialogTitle>
            <AlertDialogDescription>
              การลบจะไม่สามารถกู้คืนได้ Logs ทั้งหมดจะถูกลบด้วย
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบกฎ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
