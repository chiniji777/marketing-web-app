"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"

// ─── Types ────────────────────────────────────────────

export type ConditionMetric = "cpa" | "cpc" | "cpm" | "ctr" | "roas" | "spend" | "impressions" | "clicks" | "conversions" | "frequency"
export type ConditionOperator = "gt" | "gte" | "lt" | "lte" | "eq"
export type ActionType = "pause_campaign" | "resume_campaign" | "adjust_budget" | "send_alert"

export interface RuleCondition {
  metric: ConditionMetric
  operator: ConditionOperator
  value: number
}

export interface RuleAction {
  type: ActionType
  params?: Record<string, unknown>
}

export interface RuleBuilderData {
  conditions: RuleCondition[]
  logic: "AND" | "OR"
  actions: RuleAction[]
}

// ─── Constants ────────────────────────────────────────

const METRIC_OPTIONS: { value: ConditionMetric; label: string }[] = [
  { value: "cpa", label: "CPA (ต้นทุนต่อ action)" },
  { value: "cpc", label: "CPC (ต้นทุนต่อคลิก)" },
  { value: "cpm", label: "CPM (ต้นทุนต่อ 1,000 impr.)" },
  { value: "ctr", label: "CTR (%)" },
  { value: "roas", label: "ROAS (ผลตอบแทน)" },
  { value: "spend", label: "ค่าใช้จ่าย (฿)" },
  { value: "impressions", label: "Impressions" },
  { value: "clicks", label: "Clicks" },
  { value: "conversions", label: "Conversions" },
  { value: "frequency", label: "Frequency" },
]

const OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
]

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: "pause_campaign", label: "หยุดแคมเปญ" },
  { value: "resume_campaign", label: "เปิดแคมเปญ" },
  { value: "adjust_budget", label: "ปรับงบประมาณ" },
  { value: "send_alert", label: "ส่งแจ้งเตือน" },
]

// ─── Helper Functions ────────────────────────────────

export function metricLabel(metric: ConditionMetric): string {
  return METRIC_OPTIONS.find((m) => m.value === metric)?.label || metric
}

export function operatorLabel(operator: ConditionOperator): string {
  return OPERATOR_OPTIONS.find((o) => o.value === operator)?.label || operator
}

export function actionLabel(type: ActionType): string {
  return ACTION_OPTIONS.find((a) => a.value === type)?.label || type
}

export function conditionToText(c: RuleCondition): string {
  return `${metricLabel(c.metric)} ${operatorLabel(c.operator)} ${c.value}`
}

export function actionToText(a: RuleAction): string {
  const label = actionLabel(a.type)
  if (a.type === "adjust_budget" && a.params?.change_pct !== undefined) {
    const pct = Number(a.params.change_pct)
    return `${label} ${pct > 0 ? "+" : ""}${pct}%`
  }
  return label
}

// ─── Component ────────────────────────────────────────

interface RuleBuilderProps {
  data: RuleBuilderData
  onChange: (data: RuleBuilderData) => void
}

export function RuleBuilder({ data, onChange }: RuleBuilderProps) {
  const addCondition = () => {
    onChange({
      ...data,
      conditions: [...data.conditions, { metric: "cpa", operator: "gt", value: 0 }],
    })
  }

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = data.conditions.map((c, i) =>
      i === index ? { ...c, ...updates } : c
    )
    onChange({ ...data, conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    onChange({ ...data, conditions: data.conditions.filter((_, i) => i !== index) })
  }

  const addAction = () => {
    onChange({
      ...data,
      actions: [...data.actions, { type: "pause_campaign" }],
    })
  }

  const updateAction = (index: number, type: ActionType) => {
    const newActions = data.actions.map((a, i) =>
      i === index ? { type, params: type === "adjust_budget" ? { change_pct: -10 } : undefined } : a
    )
    onChange({ ...data, actions: newActions })
  }

  const updateActionParam = (index: number, key: string, value: unknown) => {
    const newActions = data.actions.map((a, i) =>
      i === index ? { ...a, params: { ...a.params, [key]: value } } : a
    )
    onChange({ ...data, actions: newActions })
  }

  const removeAction = (index: number) => {
    onChange({ ...data, actions: data.actions.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      {/* Conditions Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">เงื่อนไข (Conditions)</CardTitle>
            {data.conditions.length > 1 && (
              <div className="flex items-center gap-1 rounded-md border p-0.5">
                <button
                  type="button"
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${data.logic === "AND" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => onChange({ ...data, logic: "AND" })}
                >
                  AND
                </button>
                <button
                  type="button"
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${data.logic === "OR" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => onChange({ ...data, logic: "OR" })}
                >
                  OR
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.conditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  {data.logic}
                </Badge>
              )}
              <Select
                value={condition.metric}
                onValueChange={(v) => updateCondition(index, { metric: v as ConditionMetric })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.operator}
                onValueChange={(v) => updateCondition(index, { operator: v as ConditionOperator })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                value={condition.value}
                onChange={(e) => updateCondition(index, { value: Number(e.target.value) })}
                className="w-[120px]"
                placeholder="ค่า"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addCondition}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            เพิ่มเงื่อนไข
          </Button>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">การกระทำ (Actions)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.actions.map((action, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={action.type}
                onValueChange={(v) => updateAction(index, v as ActionType)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {action.type === "adjust_budget" && (
                <div className="flex items-center gap-1">
                  <Label className="shrink-0 text-sm text-muted-foreground">ปรับ</Label>
                  <Input
                    type="number"
                    value={Number(action.params?.change_pct ?? 0)}
                    onChange={(e) => updateActionParam(index, "change_pct", Number(e.target.value))}
                    className="w-[100px]"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAction(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addAction}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            เพิ่มการกระทำ
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
