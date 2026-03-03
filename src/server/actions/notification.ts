"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { revalidatePath } from "next/cache"

export async function getNotifications(filters?: {
  unreadOnly?: boolean
  page?: number
  perPage?: number
}) {
  const { userId, db } = await getOrgContext()
  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = { userId }
  if (filters?.unreadOnly) where.isRead = false

  // Sequential to avoid connection pool exhaustion (local Prisma Postgres has connection_limit=1)
  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
  })
  const total = await db.notification.count({ where })
  const unreadCount = await db.notification.count({ where: { userId, isRead: false } })

  return {
    notifications,
    unreadCount,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  }
}

export async function markAsRead(id: string) {
  const { userId, db } = await getOrgContext()
  await db.notification.update({
    where: { id, userId },
    data: { isRead: true },
  })
  revalidatePath("/notifications")
}

export async function markAllAsRead() {
  const { userId, db } = await getOrgContext()
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
  revalidatePath("/notifications")
}

export async function deleteNotification(id: string) {
  const { userId, db } = await getOrgContext()
  await db.notification.delete({
    where: { id, userId },
  })
  revalidatePath("/notifications")
}

export async function getUnreadCount() {
  const { userId, db } = await getOrgContext()
  return db.notification.count({ where: { userId, isRead: false } })
}
