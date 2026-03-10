"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MessageSquare, Check, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { submitReview } from "@/server/actions/review"

function getScoreColor(score: number) {
  if (score <= 3) return { bg: "bg-red-500", text: "text-red-600", track: "bg-red-100" }
  if (score <= 6) return { bg: "bg-yellow-500", text: "text-yellow-600", track: "bg-yellow-100" }
  return { bg: "bg-green-500", text: "text-green-600", track: "bg-green-100" }
}

function getScoreLabel(score: number) {
  if (score <= 3) return "Needs Work"
  if (score <= 6) return "Acceptable"
  if (score <= 8) return "Good"
  return "Excellent"
}

interface ReviewPanelProps {
  contentId: string
  contentStatus: string
  onReviewSubmitted?: () => void
}

export function ReviewPanel({ contentId, contentStatus, onReviewSubmitted }: ReviewPanelProps) {
  const [score, setScore] = useState(7)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()

  const colors = getScoreColor(score)
  const canReview = contentStatus === "PENDING_REVIEW" || contentStatus === "DRAFT"

  const handleSubmit = (action: "approve" | "request_changes") => {
    if (!comment.trim()) {
      toast.error("Please add a comment before submitting")
      return
    }

    startTransition(async () => {
      try {
        await submitReview({
          contentId,
          score,
          comment: comment.trim(),
          action,
        })
        toast.success(action === "approve" ? "Content approved!" : "Changes requested")
        setComment("")
        setScore(7)
        onReviewSubmitted?.()
      } catch {
        toast.error("Failed to submit review")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Score</Label>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>
                {score}
              </span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
          </div>

          {/* Custom Score Slider */}
          <div className="space-y-1.5">
            <div className={`relative h-2 w-full rounded-full ${colors.track} transition-colors duration-300`}>
              <div
                className={`absolute left-0 top-0 h-full rounded-full ${colors.bg} transition-all duration-300`}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full cursor-pointer opacity-0 h-2 -mt-2 relative"
              disabled={!canReview || isPending}
              aria-label="Score"
              aria-valuetext={getScoreLabel(score)}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span className={`font-medium ${colors.text} transition-colors duration-300`}>
                {getScoreLabel(score)}
              </span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="review-comment">Comment</Label>
          <Textarea
            id="review-comment"
            placeholder="Share your feedback on this content..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canReview || isPending}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Action Buttons */}
        {canReview && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleSubmit("request_changes")}
              disabled={isPending || !comment.trim()}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Request Changes
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => handleSubmit("approve")}
              disabled={isPending || !comment.trim()}
            >
              <Check className="mr-1 h-3 w-3" />
              Approve
            </Button>
          </div>
        )}

        {!canReview && (
          <p className="text-xs text-muted-foreground text-center">
            Reviews can only be submitted for Draft or Pending Review content.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
