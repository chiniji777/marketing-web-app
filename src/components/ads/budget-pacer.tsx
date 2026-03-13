"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CampaignBudget {
  id: string
  name: string
  spent: number
  budget: number
  daysLeft: number
  totalDays: number
}

interface BudgetPacerProps {
  campaigns: CampaignBudget[]
}

function getPaceStatus(spent: number, budget: number, daysLeft: number, totalDays: number) {
  if (budget <= 0) return { status: "neutral" as const, label: "ไม่มีงบ" }
  const elapsed = totalDays - daysLeft
  const expectedSpend = elapsed > 0 ? (budget / totalDays) * elapsed : 0
  const ratio = expectedSpend > 0 ? spent / expectedSpend : 0

  if (ratio > 1.15) return { status: "overspend" as const, label: "เกินงบ" }
  if (ratio < 0.85) return { status: "underspend" as const, label: "ใช้น้อย" }
  return { status: "onpace" as const, label: "ตามแผน" }
}

export function BudgetPacer({ campaigns }: BudgetPacerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Pacer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            ไม่มี campaign ที่มี budget
          </p>
        )}
        {campaigns.map((c) => {
          const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0
          const { status, label } = getPaceStatus(c.spent, c.budget, c.daysLeft, c.totalDays)
          const timePct = c.totalDays > 0 ? ((c.totalDays - c.daysLeft) / c.totalDays) * 100 : 0

          return (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate mr-2">{c.name}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    status === "onpace" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
                    status === "underspend" && "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                    status === "overspend" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  )}
                >
                  {label}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    status === "onpace" && "bg-emerald-500",
                    status === "underspend" && "bg-amber-500",
                    status === "overspend" && "bg-red-500"
                  )}
                  style={{ width: `${pct}%` }}
                />
                {/* Time marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/30"
                  style={{ left: `${timePct}%` }}
                  title={`เวลาผ่านไป ${timePct.toFixed(0)}%`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>฿{c.spent.toLocaleString()} / ฿{c.budget.toLocaleString()}</span>
                <span>เหลือ {c.daysLeft} วัน</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
