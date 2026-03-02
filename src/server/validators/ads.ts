import { z } from "zod"

export const createAdsCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN", "TIKTOK", "YOUTUBE", "PINTEREST"]),
  objective: z.string().min(1),
  dailyBudget: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetAudience: z.string().optional(),
  adContent: z.string().optional(),
})

export const updateAdsCampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "COMPLETED", "REJECTED"]).optional(),
  dailyBudget: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const createAdsSetSchema = z.object({
  adsCampaignId: z.string(),
  name: z.string().min(1).max(200),
  targetAudience: z.string().optional(),
  budget: z.number().positive().optional(),
  bidAmount: z.number().positive().optional(),
})

export type CreateAdsCampaignInput = z.infer<typeof createAdsCampaignSchema>
export type UpdateAdsCampaignInput = z.infer<typeof updateAdsCampaignSchema>
export type CreateAdsSetInput = z.infer<typeof createAdsSetSchema>
