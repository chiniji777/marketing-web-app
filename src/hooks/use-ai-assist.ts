"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

type AssistType =
  | "email_subject"
  | "email_content"
  | "campaign_description"
  | "seo_keywords"
  | "social_post"
  | "ad_copy"
  | "improve_text"

interface UseAIAssistOptions {
  onSuccess?: (result: string) => void
  onError?: (error: string) => void
}

export function useAIAssist(options?: UseAIAssistOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const generate = useCallback(
    async (type: AssistType, context?: Record<string, unknown>, language = "th") => {
      setIsLoading(true)
      setResult(null)

      try {
        const res = await fetch("/api/ai/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, context, language }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "AI request failed")
        }

        const data = await res.json()
        setResult(data.result)
        options?.onSuccess?.(data.result)
        return data.result as string
      } catch (err) {
        const message = err instanceof Error ? err.message : "AI ไม่สามารถสร้างได้"
        toast.error(message)
        options?.onError?.(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  return { generate, isLoading, result }
}
