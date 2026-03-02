"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Megaphone,
  Users,
  Mail,
  TrendingUp,
  AlertCircle,
  Info,
  ExternalLink,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/server/actions/notification"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  actionUrl: string | null
  metadata: unknown
  createdAt: string
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  campaign: { icon: Megaphone, color: "text-blue-600 bg-blue-100" },
  lead: { icon: Users, color: "text-purple-600 bg-purple-100" },
  email: { icon: Mail, color: "text-orange-600 bg-orange-100" },
  seo: { icon: TrendingUp, color: "text-emerald-600 bg-emerald-100" },
  alert: { icon: AlertCircle, color: "text-red-600 bg-red-100" },
  info: { icon: Info, color: "text-sky-600 bg-sky-100" },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: Bell, color: "text-muted-foreground bg-muted" }
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filterUnread, setFilterUnread] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await getNotifications({ unreadOnly: filterUnread })
      setNotifications(data.notifications as unknown as Notification[])
      setUnreadCount(data.unreadCount)
    } catch {
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [filterUnread])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      const deleted = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (deleted && !deleted.isRead) setUnreadCount((c) => Math.max(0, c - 1))
      toast.success("Notification deleted")
    } catch {
      toast.error("Failed to delete notification")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading={t.notif.title} description={t.notif.title}>
        <div className="flex items-center gap-2">
          <Button
            variant={filterUnread ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterUnread(!filterUnread)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {filterUnread ? "Show All" : "Unread Only"}
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              {t.notif.markAllRead}
            </Button>
          )}
        </div>
      </PageHeader>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filterUnread ? "No unread notifications" : "No notifications"}
          description={
            filterUnread
              ? "You're all caught up! Switch to show all to see read notifications"
              : "New notifications will appear here when something important happens"
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = getTypeConfig(notification.type)
            const Icon = config.icon
            return (
              <Card
                key={notification.id}
                className={`transition-colors ${
                  !notification.isRead ? "border-primary/20 bg-primary/[0.02]" : ""
                }`}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {notification.actionUrl && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                          <Link href={notification.actionUrl}>
                            View <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleMarkRead(notification.id)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
