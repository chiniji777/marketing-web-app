"use server"

import { getOrgContext } from "@/server/lib/org-context"
import { prisma } from "@/lib/prisma"
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

// ─── Helpers ────────────────────────────────────────────────

async function getReviewerRole(userId: string, organizationId: string): Promise<string> {
  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId, isActive: true },
    select: { role: true },
  })
  if (membership?.role === "ADMIN" || membership?.role === "OWNER") return "owner"
  return "member"
}

// ─── Submit Review ──────────────────────────────────────────

export async function submitReview(input: SubmitReviewInput): Promise<ReviewResult> {
  const { userId, organizationId, db } = await getOrgContext()

  if (input.score < 1 || input.score > 10) {
    throw new Error("Score must be between 1 and 10")
  }
  if (!input.comment.trim()) {
    throw new Error("Comment is required")
  }

  // Verify content belongs to this org
  const content = await db.content.findFirst({
    where: { id: input.contentId },
    select: { id: true },
  })
  if (!content) throw new Error("Content not found")

  const reviewerRole = await getReviewerRole(userId, organizationId)
  const actionEnum = input.action === "approve" ? "APPROVE" : "REQUEST_CHANGES"

  // Create review record
  const review = await prisma.contentReview.create({
    data: {
      contentId: input.contentId,
      reviewerId: userId,
      score: input.score,
      comment: input.comment.trim(),
      action: actionEnum,
      reviewerRole,
    },
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
    },
  })

  // Update content status based on action
  const newStatus = input.action === "approve" ? "APPROVED" : "DRAFT"
  await db.content.update({
    where: { id: input.contentId },
    data: { status: newStatus },
  })

  revalidatePath(`/content/${input.contentId}`)
  revalidatePath("/content")

  return {
    id: review.id,
    score: review.score,
    comment: review.comment,
    action: input.action,
    reviewerRole: review.reviewerRole as "owner" | "qa" | "member",
    reviewer: review.reviewer,
    createdAt: review.createdAt,
  }
}

// ─── Get Reviews ────────────────────────────────────────────

export async function getReviews(contentId: string): Promise<ReviewResult[]> {
  await getOrgContext() // auth check

  const reviews = await prisma.contentReview.findMany({
    where: { contentId },
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return reviews.map((r) => ({
    id: r.id,
    score: r.score,
    comment: r.comment,
    action: r.action === "APPROVE" ? "approve" as const : "request_changes" as const,
    reviewerRole: r.reviewerRole as "owner" | "qa" | "member",
    reviewer: r.reviewer,
    createdAt: r.createdAt,
  }))
}

// ─── Update AI Memory ───────────────────────────────────────
// Collects all review feedback for this content and stores as AI learning data

export async function updateAiMemory(contentId: string): Promise<void> {
  const { db } = await getOrgContext()

  const content = await db.content.findFirst({
    where: { id: contentId },
    select: { id: true, title: true, body: true, aiPrompt: true },
  })
  if (!content) throw new Error("Content not found")

  // Fetch all reviews for this content
  const reviews = await prisma.contentReview.findMany({
    where: { contentId },
    select: { score: true, comment: true, action: true, reviewerRole: true },
    orderBy: { createdAt: "desc" },
  })

  if (reviews.length === 0) throw new Error("No reviews to learn from")

  // Store feedback summary in content metadata (using aiPrompt field as memory)
  // TODO: When AiMemoryLog model is added by backend, store there instead
  const feedbackSummary = reviews.map((r) =>
    `[${r.reviewerRole}] Score:${r.score}/10 Action:${r.action} — ${r.comment}`
  ).join(" | ")

  await db.content.update({
    where: { id: contentId },
    data: {
      aiPrompt: content.aiPrompt
        ? `${content.aiPrompt}\n\n--- Review Feedback ---\n${feedbackSummary}`
        : `--- Review Feedback ---\n${feedbackSummary}`,
    },
  })

  revalidatePath(`/content/${contentId}`)
}
