"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Brain, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateAiMemory } from "@/server/actions/review"
import { cn } from "@/lib/utils"

interface AiMemoryButtonProps {
  contentId: string
  hasReviews: boolean
}

export function AiMemoryButton({ contentId, hasReviews }: AiMemoryButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        await updateAiMemory(contentId)
        setIsSuccess(true)
        toast.success("AI memory updated with review feedback!")
        setTimeout(() => setIsSuccess(false), 3000)
      } catch {
        toast.error("Failed to update AI memory")
      }
    })
  }

  return (
    <Button
      variant={isSuccess ? "default" : "outline"}
      size="sm"
      onClick={handleUpdate}
      disabled={isPending || !hasReviews}
      className={cn(
        "w-full transition-all duration-500",
        isSuccess && "bg-green-600 hover:bg-green-600 text-white",
        isPending && "animate-pulse"
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating Memory...
        </>
      ) : isSuccess ? (
        <>
          <Check className="mr-2 h-4 w-4 animate-[bounce-in_0.4s_ease-out]" />
          Memory Updated!
        </>
      ) : (
        <>
          <Brain className="mr-2 h-4 w-4" />
          Update AI Memory
        </>
      )}
    </Button>
  )
}
