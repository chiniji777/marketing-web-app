"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Zap,
  Pencil,
  Trash2,
  Clock,
  Hash,
  ScrollText,
  CalendarClock,
} from "lucide-react"
import { toast } from "sonner"
import { getAdRule, toggleAdRule, deleteAdRule } from "@/server/actions/ads-rules"
import {
  conditionToText,
  actionToText,
  type RuleCondition,
  type RuleAction,
} from "@/components/ads/rule-builder"

interface RuleLog {
  id: string
  action: string
  details: Record<string, unknown>
  entityId: string | null
  createdAt: string
}

interface AdRuleDetail {
  id: string
  name: string
  description: string | null
  conditions: { conditions: RuleCondition[]; logic: "AND" | "OR" }
  actions: { actions: RuleAction[] }
  scope: { campaignIds?: string[]; platform?: string }
  schedule: string | null
  isActive: boolean
  lastRunAt: string | null
  runCount: number
  createdAt: string
  updatedAt: string
  logs: RuleLog[]
}

export default function RuleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ruleId = params.id as string

  const [rule, setRule] = useState<AdRuleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdRule(ruleId)
        setRule(data as unknown as AdRuleDetail)
      } catch {
        toast.error("ไม่พบกฎนี้")
        router.push("/ads/rules")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [ruleId, router])

  const handleToggle = async () => {
    if (!rule) return
    try {
      const updated = await toggleAdRule(rule.id)
      setRule({ ...rule, isActive: (updated as unknown as { isActive: boolean }).isActive })
      toast.success("อัปเดตสถานะกฎแล้ว")
    } catch {
      toast.error("ไม่สามารถเปลี่ยนสถานะได้")
    }
  }

  const handleDelete = async () => {
    if (!rule) return
    try {
      await deleteAdRule(rule.id)
      toast.success("ลบกฎแล้ว")
      router.push("/ads/rules")
    } catch {
      toast.error("ไม่สามารถลบกฎได้")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!rule) return null

  const conditions = rule.conditions?.conditions || []
  const actions = rule.actions?.actions || []
  const logic = rule.conditions?.logic || "AND"

  return (
    <div className="space-y-6">
      <PageHeader
        heading={rule.name}
        description={rule.description || undefined}
        backHref="/ads/rules"
        backLabel="กลับหน้ากฎ"
      >
        <div className="flex items-center gap-2">
          <Switch checked={rule.isActive} onCheckedChange={handleToggle} />
          <span className="text-sm text-muted-foreground">
            {rule.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </span>
        </div>
        <Button variant="outline" onClick={() => router.push(`/ads/rules/create?edit=${rule.id}`)}>
          <Pencil className="mr-2 h-4 w-4" />แก้ไข
        </Button>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" />ลบ
        </Button>
      </PageHeader>

      {/* Rule Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Conditions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-yellow-500" />
              เงื่อนไข
            </CardTitle>
            <CardDescription>
              ตรวจสอบแบบ {logic === "AND" ? "ทุกเงื่อนไข (AND)" : "อย่างน้อย 1 เงื่อนไข (OR)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <Badge variant="outline" className="text-xs">{logic}</Badge>}
                <Badge variant="secondary" className="font-mono">
                  {conditionToText(c)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions & Meta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">การกระทำ & ข้อมูล</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Actions:</p>
              <div className="flex flex-wrap gap-1.5">
                {actions.map((a, i) => (
                  <Badge key={i} variant="outline">{actionToText(a)}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              {rule.schedule && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Schedule: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{rule.schedule}</code>
                </div>
              )}
              {rule.lastRunAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  รันล่าสุด: {new Date(rule.lastRunAt).toLocaleString("th-TH")}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                รันทั้งหมด: {rule.runCount} ครั้ง
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                สร้างเมื่อ: {new Date(rule.createdAt).toLocaleString("th-TH")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-4 w-4" />
            Rule Logs ({rule.logs.length})
          </CardTitle>
          <CardDescription>ประวัติการทำงานของกฎ (ล่าสุด 20 รายการ)</CardDescription>
        </CardHeader>
        <CardContent>
          {rule.logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีประวัติการทำงาน
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">วัน/เวลา</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Campaign ID</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rule.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entityId ? log.entityId.slice(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                        {JSON.stringify(log.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกฎ &quot;{rule.name}&quot;?</AlertDialogTitle>
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
