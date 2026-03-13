"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HeatmapDataPoint {
  day: number // 0=จันทร์ .. 6=อาทิตย์
  hour: number // 0-23
  value: number
}

interface HourlyHeatmapProps {
  data: HeatmapDataPoint[]
  label?: string
}

const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์", "อาทิตย์"]

function getColor(value: number, max: number): string {
  if (max === 0) return "bg-muted"
  const ratio = value / max
  if (ratio > 0.75) return "bg-emerald-500 dark:bg-emerald-600"
  if (ratio > 0.5) return "bg-emerald-400 dark:bg-emerald-500"
  if (ratio > 0.25) return "bg-emerald-300 dark:bg-emerald-700"
  if (ratio > 0) return "bg-emerald-200 dark:bg-emerald-800"
  return "bg-muted"
}

export function HourlyHeatmap({ data, label = "CTR" }: HourlyHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    day: number
    hour: number
    value: number
    x: number
    y: number
  } | null>(null)

  const max = Math.max(...data.map((d) => d.value), 1)

  // Build lookup
  const lookup = new Map<string, number>()
  data.forEach((d) => lookup.set(`${d.day}-${d.hour}`, d.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap รายชั่วโมง ({label})</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="mb-1 flex gap-0.5 pl-14">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="flex-1 text-center text-[10px] text-muted-foreground"
                >
                  {h % 3 === 0 ? `${String(h).padStart(2, "0")}` : ""}
                </div>
              ))}
            </div>
            {/* Grid */}
            {DAYS.map((day, d) => (
              <div key={d} className="flex items-center gap-0.5 mb-0.5">
                <div className="w-12 shrink-0 text-right text-xs text-muted-foreground pr-2">
                  {day.slice(0, 2)}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = lookup.get(`${d}-${h}`) ?? 0
                  return (
                    <div
                      key={h}
                      className={cn(
                        "flex-1 aspect-square rounded-sm cursor-default transition-opacity",
                        getColor(val, max)
                      )}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({
                          day: d,
                          hour: h,
                          value: val,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
            style={{ left: tooltip.x, top: tooltip.y - 44, transform: "translateX(-50%)" }}
          >
            <span className="font-medium">{DAYS[tooltip.day]} {String(tooltip.hour).padStart(2, "0")}:00</span>
            <span className="ml-2 text-muted-foreground">{label}: {tooltip.value.toFixed(2)}</span>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>ต่ำ</span>
          <div className="h-2.5 w-3 rounded-sm bg-muted" />
          <div className="h-2.5 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-800" />
          <div className="h-2.5 w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
          <div className="h-2.5 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
          <div className="h-2.5 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
          <span>สูง</span>
        </div>
      </CardContent>
    </Card>
  )
}
