"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { createAdRule, updateAdRule, getAdRule } from "@/server/actions/ads-rules"
import {
  RuleBuilder,
  type RuleBuilderData,
  type RuleCondition,
  type RuleAction,
} from "@/components/ads/rule-builder"

const SCHEDULE_OPTIONS = [
  { value: "none", label: "ไม่ตั้งเวลา" },
  { value: "0 * * * *", label: "ทุกชั่วโมง" },
  { value: "0 */6 * * *", label: "ทุก 6 ชั่วโมง" },
  { value: "0 */12 * * *", label: "ทุก 12 ชั่วโมง" },
  { value: "0 0 * * *", label: "ทุกวัน (เที่ยงคืน)" },
  { value: "0 8 * * *", label: "ทุกวัน (8 โมงเช้า)" },
]

export default function CreateRulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [schedule, setSchedule] = useState("none")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!editId)

  const [builderData, setBuilderData] = useState<RuleBuilderData>({
    conditions: [{ metric: "cpa", operator: "gt", value: 100 }],
    logic: "AND",
    actions: [{ type: "pause_campaign" }],
  })

  useEffect(() => {
    if (!editId) return

    async function loadRule() {
      try {
        const rule = await getAdRule(editId!)
        setName(rule.name)
        setDescription(rule.description || "")
        setSchedule(rule.schedule || "none")
        const conds = rule.conditions as unknown as { conditions: RuleCondition[]; logic: "AND" | "OR" }
        const acts = rule.actions as unknown as { actions: RuleAction[] }
        setBuilderData({
          conditions: conds.conditions || [],
          logic: conds.logic || "AND",
          actions: acts.actions || [],
        })
      } catch {
        toast.error("ไม่สามารถโหลดกฎได้")
        router.push("/ads/rules")
      } finally {
        setLoading(false)
      }
    }

    loadRule()
  }, [editId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("กรุณาใส่ชื่อกฎ")
      return
    }
    if (builderData.conditions.length === 0) {
      toast.error("กรุณาเพิ่มเงื่อนไขอย่างน้อย 1 ข้อ")
      return
    }
    if (builderData.actions.length === 0) {
      toast.error("กรุณาเพิ่มการกระทำอย่างน้อย 1 อย่าง")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        conditions: { conditions: builderData.conditions, logic: builderData.logic },
        actions: { actions: builderData.actions },
        scope: {},
        schedule: schedule !== "none" ? schedule : undefined,
      }

      if (editId) {
        await updateAdRule({ id: editId, ...payload })
        toast.success("อัปเดตกฎแล้ว")
      } else {
        await createAdRule(payload)
        toast.success("สร้างกฎสำเร็จ")
      }

      router.push("/ads/rules")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถบันทึกได้"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading={editId ? "แก้ไขกฎ" : "สร้างกฎใหม่"}
        description="ตั้งกฎอัตโนมัติสำหรับจัดการแคมเปญโฆษณา"
        backHref="/ads/rules"
        backLabel="กลับหน้ากฎ"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ข้อมูลทั่วไป</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อกฎ *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น หยุดแคมเปญ CPA สูง"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายกฎนี้ (ไม่บังคับ)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rule Builder */}
        <RuleBuilder data={builderData} onChange={setBuilderData} />

        {/* Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ตั้งเวลาทำงาน (Schedule)</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="เลือกความถี่" />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {editId ? "บันทึก" : "สร้างกฎ"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/ads/rules")}>
            <X className="mr-2 h-4 w-4" />
            ยกเลิก
          </Button>
        </div>
      </form>
    </div>
  )
}
