"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  GripVertical,
  Package,
  Clock,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { getContents } from "@/server/actions/content"
import { updateContentSchedule, getProductsSimple } from "@/server/actions/product"

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
  productId?: string | null
}

interface SimpleProduct {
  id: string
  name: string
  category: string | null
  marketingDataScore: number
}

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."]
const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

export default function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [contents, setContents] = useState<ContentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<ContentEvent | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [filterProduct, setFilterProduct] = useState("all")
  const [products, setProducts] = useState<SimpleProduct[]>([])

  // Schedule dialog state
  const [scheduleDialog, setScheduleDialog] = useState<{
    open: boolean
    item: ContentEvent | null
    date: Date | null
    time: string
  }>({ open: false, item: null, date: null, time: "09:00" })
  const [isScheduling, setIsScheduling] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchContents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getContents({ perPage: 200 })
      setContents(result.contents as unknown as ContentEvent[])
    } catch {
      toast.error("ไม่สามารถโหลดเนื้อหาได้")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContents()
    getProductsSimple().then((data) => setProducts(data as unknown as SimpleProduct[])).catch(() => {})
  }, [fetchContents])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const days: Date[] = []
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const current = new Date(startDate)
    while (days.length < 42) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
      if (days.length >= 35 && current.getMonth() !== month) break
    }
    return days
  }, [year, month])

  // Filtered contents
  const filteredContents = useMemo(() => {
    if (filterProduct === "all") return contents
    return contents.filter((c) => (c as ContentEvent & { productId?: string }).productId === filterProduct)
  }, [contents, filterProduct])

  // Events by date (scheduled/published only)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ContentEvent[]>()
    for (const content of filteredContents) {
      if (!content.scheduledAt && content.status !== "PUBLISHED") continue
      const date = content.scheduledAt
        ? new Date(content.scheduledAt)
        : new Date(content.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const existing = map.get(key) ?? []
      existing.push(content)
      map.set(key, existing)
    }
    return map
  }, [filteredContents])

  // Sidebar: Approved/Draft content ready to schedule (not yet scheduled)
  const readyToSchedule = useMemo(() => {
    return filteredContents.filter(
      (c) => (c.status === "APPROVED" || c.status === "DRAFT" || c.status === "PENDING_REVIEW") && !c.scheduledAt
    )
  }, [filteredContents])

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, item: ContentEvent) => {
    setDraggedItem(item)
    e.dataTransfer.setData("text/plain", item.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropTarget(dateKey)
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    setDropTarget(null)

    if (!draggedItem) return

    // Open the schedule dialog with the dropped date
    setScheduleDialog({
      open: true,
      item: draggedItem,
      date,
      time: "09:00",
    })
    setDraggedItem(null)
  }

  const confirmSchedule = async () => {
    if (!scheduleDialog.item || !scheduleDialog.date) return

    setIsScheduling(true)
    const [hours, minutes] = scheduleDialog.time.split(":").map(Number)
    const scheduledAt = new Date(scheduleDialog.date)
    scheduledAt.setHours(hours, minutes, 0, 0)

    try {
      await updateContentSchedule(scheduleDialog.item.id, scheduledAt.toISOString())
      toast.success(
        `"${scheduleDialog.item.title}" กำหนดโพสวันที่ ${scheduledAt.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} เวลา ${scheduleDialog.time} น.`
      )

      // Update local state
      setContents((prev) =>
        prev.map((c) =>
          c.id === scheduleDialog.item!.id
            ? { ...c, scheduledAt: scheduledAt.toISOString(), status: "SCHEDULED" }
            : c
        )
      )
      setScheduleDialog({ open: false, item: null, date: null, time: "09:00" })
    } catch {
      toast.error("ไม่สามารถกำหนดเวลาได้")
    } finally {
      setIsScheduling(false)
    }
  }

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const today = new Date()
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Content Calendar"
        description="วางแผนและกำหนดเวลาโพสเนื้อหา — ลากเนื้อหาจากซ้ายไปวางในปฏิทิน"
        backHref="/content"
      >
        <div className="flex items-center gap-2">
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ทุกสินค้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสินค้า</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <Package className="mr-1 inline h-3 w-3" />
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href="/content/generator">
              <Plus className="mr-2 h-4 w-4" />
              สร้างเนื้อหา
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ─── Sidebar: Ready to Schedule ─── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GripVertical className="h-4 w-4" />
                พร้อมกำหนดเวลา ({readyToSchedule.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {readyToSchedule.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  ไม่มีเนื้อหาที่พร้อม — สร้างเนื้อหาใหม่แล้วมาวางแผนได้
                </p>
              ) : (
                readyToSchedule.map((item) => {
                  const TypeIcon = TYPE_ICONS[item.contentType] ?? FileText
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className={`flex cursor-grab items-center gap-2 rounded-lg border p-2 transition-colors hover:bg-muted/50 active:cursor-grabbing ${
                        STATUS_COLORS[item.status] ?? STATUS_COLORS.DRAFT
                      }`}
                    >
                      <GripVertical className="h-3 w-3 shrink-0 opacity-50" />
                      <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{item.title}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-70">
                            {item.contentType.replace("_", " ")}
                          </span>
                          {item.aiGenerated && (
                            <Sparkles className="h-2.5 w-2.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4" />
                กำหนดการที่จะมาถึง
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const scheduled = filteredContents
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
                    <p className="text-xs text-muted-foreground">
                      ยังไม่มีเนื้อหาที่กำหนดเวลา
                    </p>
                  )
                }

                return (
                  <div className="space-y-2">
                    {scheduled.map((content) => (
                      <Link
                        key={content.id}
                        href={`/content/${content.id}`}
                        className="block rounded-lg border p-2 text-xs transition-colors hover:bg-muted/50"
                      >
                        <p className="truncate font-medium">{content.title}</p>
                        <p className="text-muted-foreground">
                          {new Date(content.scheduledAt!).toLocaleDateString("th-TH", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </Link>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>

        {/* ─── Calendar Grid ─── */}
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
                {MONTHS[month]} {year + 543}
              </h2>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                วันนี้
              </Button>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {[
                { label: "แบบร่าง", color: "bg-gray-400" },
                { label: "กำหนดเวลา", color: "bg-purple-500" },
                { label: "เผยแพร่แล้ว", color: "bg-green-500" },
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
                <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
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
                const isDropping = dropTarget === key

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border-b border-r p-1.5 transition-colors ${
                      !isCurrentMonth ? "bg-muted/30" : ""
                    } ${index % 7 === 0 ? "border-l" : ""} ${
                      isDropping ? "bg-primary/10 ring-2 ring-primary/30 ring-inset" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, date)}
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
                        const eventTime = event.scheduledAt
                          ? new Date(event.scheduledAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                          : null
                        return (
                          <Link
                            key={event.id}
                            href={`/content/${event.id}`}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors hover:opacity-80 ${
                              STATUS_COLORS[event.status] ?? STATUS_COLORS.DRAFT
                            }`}
                          >
                            <TypeIcon className="h-3 w-3 shrink-0" />
                            {eventTime && (
                              <span className="shrink-0 opacity-70">{eventTime}</span>
                            )}
                            <span className="truncate">{event.title}</span>
                            {event.aiGenerated && (
                              <Sparkles className="h-2.5 w-2.5 shrink-0" />
                            )}
                          </Link>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <p className="px-1 text-xs text-muted-foreground">
                          +{dayEvents.length - 3} เพิ่มเติม
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Time Dialog */}
      <Dialog
        open={scheduleDialog.open}
        onOpenChange={(open) => {
          if (!open) setScheduleDialog({ open: false, item: null, date: null, time: "09:00" })
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              กำหนดเวลาโพส
            </DialogTitle>
            <DialogDescription>
              เลือกวันและเวลาที่ต้องการโพส &quot;{scheduleDialog.item?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>วันที่</Label>
              <Input
                type="date"
                value={scheduleDialog.date ? scheduleDialog.date.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const newDate = new Date(e.target.value)
                  if (!isNaN(newDate.getTime())) {
                    setScheduleDialog((prev) => ({ ...prev, date: newDate }))
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>เวลาโพส</Label>
              <Input
                type="time"
                value={scheduleDialog.time}
                onChange={(e) => setScheduleDialog((prev) => ({ ...prev, time: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                {["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"].map((t) => (
                  <Button
                    key={t}
                    variant={scheduleDialog.time === t ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setScheduleDialog((prev) => ({ ...prev, time: t }))}
                  >
                    {t} น.
                  </Button>
                ))}
              </div>
            </div>

            {scheduleDialog.date && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm">
                  <span className="font-medium">สรุป:</span> โพสวันที่{" "}
                  {scheduleDialog.date.toLocaleDateString("th-TH", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  เวลา {scheduleDialog.time} น.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  * ตอนนี้ระบบเป็นการวางแผนโพส — คุณจะได้รับการแจ้งเตือนเมื่อถึงเวลาที่กำหนด
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialog({ open: false, item: null, date: null, time: "09:00" })}
            >
              ยกเลิก
            </Button>
            <Button onClick={confirmSchedule} disabled={isScheduling || !scheduleDialog.date}>
              {isScheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  กำหนดเวลา
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
