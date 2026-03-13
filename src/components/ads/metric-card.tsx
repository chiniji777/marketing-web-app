"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  /** For CPA/CPC, lower is better — so "positive" change means value decreased */
  invertColors?: boolean
  icon: LucideIcon
  sparklineData?: number[]
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  invertColors = false,
  icon: Icon,
  sparklineData,
}: MetricCardProps) {
  const effectiveType = invertColors
    ? changeType === "positive" ? "negative" : changeType === "negative" ? "positive" : "neutral"
    : changeType

  const sparkData = sparklineData?.map((v, i) => ({ v, i }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <p className="text-xs">
                <span
                  className={cn(
                    "font-medium",
                    effectiveType === "positive" && "text-emerald-600 dark:text-emerald-400",
                    effectiveType === "negative" && "text-red-600 dark:text-red-400",
                    effectiveType === "neutral" && "text-muted-foreground"
                  )}
                >
                  {change}
                </span>
                <span className="text-muted-foreground"> vs ช่วงก่อน</span>
              </p>
            )}
          </div>
          {sparkData && sparkData.length > 1 && (
            <div className="h-10 w-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={
                      effectiveType === "positive" ? "#10b981"
                      : effectiveType === "negative" ? "#ef4444"
                      : "#6b7280"
                    }
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
