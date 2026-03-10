"use client"

import { useCallback, useState } from "react"
import { ReviewPanel } from "@/components/content/review-panel"
import { AiMemoryButton } from "@/components/content/ai-memory-button"
import { ReviewHistory } from "@/components/content/review-history"

interface ContentReviewSectionProps {
  contentId: string
  contentStatus: string
}

export function ContentReviewSection({ contentId, contentStatus }: ContentReviewSectionProps) {
  const [hasReviews, setHasReviews] = useState(false)

  const handleReviewsLoaded = useCallback((loaded: boolean) => {
    setHasReviews(loaded)
  }, [])

  return (
    <div className="space-y-4">
      <ReviewPanel contentId={contentId} contentStatus={contentStatus} />

      <div className="flex gap-2">
        <AiMemoryButton contentId={contentId} hasReviews={hasReviews} />
      </div>

      <ReviewHistory contentId={contentId} onReviewsLoaded={handleReviewsLoaded} />
    </div>
  )
}
