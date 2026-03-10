"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { History, Check, RotateCcw } from "lucide-react"
import { getReviews } from "@/server/actions/review"

export interface ReviewItem {
  id: string
  score: number
  comment: string
  action: "approve" | "request_changes"
  reviewerRole: "owner" | "qa" | "member"
  reviewer: {
    id: string
    name: string | null
    image: string | null
  }
  createdAt: string | Date
}

function getScoreBadge(score: number) {
  if (score <= 3) return { variant: "destructive" as const, label: `${score}/10` }
  if (score <= 6) return { variant: "secondary" as const, label: `${score}/10` }
  return { variant: "default" as const, label: `${score}/10` }
}

function getRoleBorderColor(role: string) {
  if (role === "owner") return "border-l-amber-500"
  if (role === "qa") return "border-l-blue-500"
  return "border-l-gray-300"
}

function getRoleLabel(role: string) {
  if (role === "owner") return { label: "Owner", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" }
  if (role === "qa") return { label: "QA", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" }
  return { label: "Member", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" }
}

interface ReviewHistoryProps {
  contentId: string
  onReviewsLoaded?: (hasReviews: boolean) => void
}

export function ReviewHistory({ contentId, onReviewsLoaded }: ReviewHistoryProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getReviews(contentId)
        setReviews(data)
        onReviewsLoaded?.(data.length > 0)
      } catch {
        // Reviews not available yet (model may not exist)
        setReviews([])
        onReviewsLoaded?.(false)
      }
    })
  }, [contentId, onReviewsLoaded])

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Review History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Review History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No reviews yet. Submit the first review above.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Review History ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review, index) => {
          const scoreBadge = getScoreBadge(review.score)
          const borderColor = getRoleBorderColor(review.reviewerRole)
          const roleInfo = getRoleLabel(review.reviewerRole)

          return (
            <div key={review.id}>
              <div className={`rounded-lg border border-l-4 ${borderColor} p-3 space-y-2`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={review.reviewer.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {review.reviewer.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {review.reviewer.name ?? "Unknown"}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${roleInfo.className}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={scoreBadge.variant} className="text-xs">
                      {scoreBadge.label}
                    </Badge>
                    {review.action === "approve" ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5 text-yellow-600" />
                    )}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>

                {/* Timestamp */}
                <p className="text-[11px] text-muted-foreground/60">
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {index < reviews.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="h-3 w-px bg-border" />
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
