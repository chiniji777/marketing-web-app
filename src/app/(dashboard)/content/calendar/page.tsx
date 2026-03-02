"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  FileText,
  Hash,
  Mail,
  Video,
  Megaphone,
  Layout,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { getContents } from "@/server/actions/content"

const TYPE_ICONS: Record<string, typeof FileText> = {
  SOCIAL_POST: Hash,
  BLOG_POST: FileText,
  AD_COPY: Megaphone,
  EMAIL: Mail,
  LANDING_PAGE: Layout,
  VIDEO_SCRIPT: Video,
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  SCHEDULED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ARCHIVED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
}

interface ContentEvent {
  id: string
  title: string
  contentType: string
  status: string
  scheduledAt: string | Date | null
  createdAt: string | Date
  aiGenerated: boolean
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export default function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [contents, setContents] = useState<ContentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"month" | "week">("month")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchContents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getContents({ perPage: 200 })
      setContents(result.contents as unknown as ContentEvent[])
    } catch {
      toast.error("Failed to load content")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: Date[] = []
    const current = new Date(startDate)
    while (days.length < 42) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
      if (days.length >= 35 && current.getMonth() !== month) break
    }
    return days
  }, [year, month])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ContentEvent[]>()
    for (const content of contents) {
      const date = content.scheduledAt
        ? new Date(content.scheduledAt)
        : new Date(content.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const existing = map.get(key) ?? []
      existing.push(content)
      map.set(key, existing)
    }
    return map
  }, [contents])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const today = new Date()
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Content Calendar"
        description="Plan and schedule your content"
      >
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as "month" | "week")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href="/content/generator">
              <Plus className="mr-2 h-4 w-4" />
              New Content
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          {/* Legend */}
          <div className="hidden items-center gap-3 md:flex">
            {[
              { label: "Draft", color: "bg-gray-400" },
              { label: "Scheduled", color: "bg-purple-500" },
              { label: "Published", color: "bg-green-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
              const dayEvents = eventsByDate.get(key) ?? []
              const isCurrentMonth = date.getMonth() === month

              return (
                <div
                  key={index}
                  className={`min-h-[100px] border-b border-r p-1.5 ${
                    !isCurrentMonth ? "bg-muted/30" : ""
                  } ${index % 7 === 0 ? "border-l" : ""}`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday(date)
                        ? "bg-primary font-bold text-primary-foreground"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => {
                      const TypeIcon = TYPE_ICONS[event.contentType] ?? FileText
                      return (
                        <Link
                          key={event.id}
                          href={`/content/${event.id}`}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors hover:opacity-80 ${
                            STATUS_COLORS[event.status] ?? STATUS_COLORS.DRAFT
                          }`}
                        >
                          <TypeIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.title}</span>
                          {event.aiGenerated && (
                            <Sparkles className="h-2.5 w-2.5 shrink-0" />
                          )}
                        </Link>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <p className="px-1 text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4" />
            Upcoming Scheduled Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            (() => {
              const scheduled = contents
                .filter(
                  (c) =>
                    c.scheduledAt &&
                    new Date(c.scheduledAt) >= today &&
                    (c.status === "SCHEDULED" || c.status === "APPROVED")
                )
                .sort(
                  (a, b) =>
                    new Date(a.scheduledAt!).getTime() -
                    new Date(b.scheduledAt!).getTime()
                )
                .slice(0, 5)

              if (scheduled.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No upcoming scheduled content. Create content and schedule it
                    to see it here.
                  </p>
                )
              }

              return (
                <div className="space-y-3">
                  {scheduled.map((content) => {
                    const TypeIcon = TYPE_ICONS[content.contentType] ?? FileText
                    return (
                      <Link
                        key={content.id}
                        href={`/content/${content.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{content.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(content.scheduledAt!).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {content.status}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              )
            })()
          )}
        </CardContent>
      </Card>
    </div>
  )
}
