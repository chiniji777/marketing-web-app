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
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReviewsLoaded = useCallback((loaded: boolean) => {
    setHasReviews(loaded)
  }, [])

  const handleReviewSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-4">
      <ReviewPanel
        contentId={contentId}
        contentStatus={contentStatus}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <div className="flex gap-2">
        <AiMemoryButton contentId={contentId} hasReviews={hasReviews} />
      </div>

      <ReviewHistory
        key={refreshKey}
        contentId={contentId}
        onReviewsLoaded={handleReviewsLoaded}
      />
    </div>
  )
}
