"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { revalidatePath } from "next/cache"

// ─── Types ──────────────────────────────────────────────────

interface SubmitReviewInput {
  contentId: string
  score: number
  comment: string
  action: "approve" | "request_changes"
}

interface ReviewResult {
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

// ─── Submit Review ──────────────────────────────────────────
// TODO: Backend — requires ContentReview model in Prisma schema
// Model should have: id, contentId, reviewerId, score (Int), comment (Text),
//                     action (approve/request_changes), reviewerRole, createdAt

export async function submitReview(input: SubmitReviewInput): Promise<ReviewResult> {
  const { userId, db } = await getOrgContext()

  if (input.score < 1 || input.score > 10) {
    throw new Error("Score must be between 1 and 10")
  }
  if (!input.comment.trim()) {
    throw new Error("Comment is required")
  }

  // TODO: Replace with actual Prisma call when ContentReview model is added
  // const review = await db.contentReview.create({
  //   data: {
  //     contentId: input.contentId,
  //     reviewerId: userId,
  //     score: input.score,
  //     comment: input.comment,
  //     action: input.action,
  //   },
  //   include: { reviewer: { select: { id: true, name: true, image: true } } },
  // })

  // Update content status based on action
  const newStatus = input.action === "approve" ? "APPROVED" : "DRAFT"
  await db.content.update({
    where: { id: input.contentId },
    data: { status: newStatus },
  })

  // Temporary: return constructed result until ContentReview model exists
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true },
  })

  revalidatePath(`/content/${input.contentId}`)
  revalidatePath("/content")

  return {
    id: crypto.randomUUID(),
    score: input.score,
    comment: input.comment,
    action: input.action,
    reviewerRole: "member",
    reviewer: user ?? { id: userId, name: null, image: null },
    createdAt: new Date().toISOString(),
  }
}

// ─── Get Reviews ────────────────────────────────────────────
// TODO: Backend — requires ContentReview model

export async function getReviews(_contentId: string): Promise<ReviewResult[]> {
  await getOrgContext() // auth check

  // TODO: Replace with actual Prisma call when ContentReview model is added
  // const reviews = await db.contentReview.findMany({
  //   where: { contentId },
  //   include: { reviewer: { select: { id: true, name: true, image: true } } },
  //   orderBy: { createdAt: "desc" },
  // })

  return []
}

// ─── Update AI Memory ───────────────────────────────────────
// TODO: Backend — requires AiMemoryLog model + AI integration
// Collects all review comments for this content and sends to AI memory endpoint

export async function updateAiMemory(contentId: string): Promise<void> {
  const { db } = await getOrgContext()

  // Verify content exists
  const content = await db.content.findFirst({
    where: { id: contentId },
    select: { id: true, title: true, body: true, aiPrompt: true },
  })

  if (!content) {
    throw new Error("Content not found")
  }

  // TODO: When ContentReview model exists:
  // 1. Fetch all reviews for this content
  // 2. Aggregate feedback patterns
  // 3. Store in AiMemoryLog model
  // 4. Call AI endpoint to update memory/preferences

  // TODO: Replace with actual AI memory update logic
  // const reviews = await db.contentReview.findMany({ where: { contentId } })
  // await db.aiMemoryLog.create({
  //   data: {
  //     contentId,
  //     feedbackSummary: JSON.stringify(reviews),
  //     appliedAt: new Date(),
  //   },
  // })

  revalidatePath(`/content/${contentId}`)
}
