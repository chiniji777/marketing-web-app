"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface DataPoint {
  date: string
  spend?: number
  impressions?: number
  clicks?: number
  conversions?: number
}

interface PerformanceChartProps {
  data: DataPoint[]
  dateRange: string
  onDateRangeChange: (range: string) => void
}

const DATE_RANGES = [
  { value: "7d", label: "7 วัน" },
  { value: "14d", label: "14 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "90d", label: "90 วัน" },
]

const METRICS = [
  { key: "spend", label: "ค่าใช้จ่าย", color: "#8b5cf6" },
  { key: "impressions", label: "การแสดงผล", color: "#3b82f6" },
  { key: "clicks", label: "คลิก", color: "#10b981" },
  { key: "conversions", label: "Conversions", color: "#f59e0b" },
]

export function PerformanceChart({
  data,
  dateRange,
  onDateRangeChange,
}: PerformanceChartProps) {
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(["spend", "clicks"])
  )

  const toggleMetric = (key: string) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>แนวโน้มประสิทธิภาพ</CardTitle>
          <div className="flex gap-1">
            {DATE_RANGES.map((r) => (
              <Button
                key={r.value}
                variant={dateRange === r.value ? "default" : "outline"}
                size="sm"
                onClick={() => onDateRangeChange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                visibleMetrics.has(m.key)
                  ? "border-transparent text-white"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
              style={visibleMetrics.has(m.key) ? { background: m.color } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              {METRICS.filter((m) => visibleMetrics.has(m.key)).map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
