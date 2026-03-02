import { z } from "zod"

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  description: z.string().optional(),
  type: z.enum([
    "BRAND_AWARENESS",
    "LEAD_GENERATION",
    "SALES",
    "ENGAGEMENT",
    "PRODUCT_LAUNCH",
    "EVENT",
    "CUSTOM",
  ]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().min(0).optional(),
  goalType: z.string().optional(),
  goalTarget: z.number().int().min(0).optional(),
  channels: z
    .array(
      z.enum([
        "FACEBOOK",
        "INSTAGRAM",
        "TWITTER",
        "LINKEDIN",
        "TIKTOK",
        "YOUTUBE",
        "PINTEREST",
      ])
    )
    .min(1, "Select at least one channel"),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const updateCampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"])
    .optional(),
  type: z
    .enum([
      "BRAND_AWARENESS",
      "LEAD_GENERATION",
      "SALES",
      "ENGAGEMENT",
      "PRODUCT_LAUNCH",
      "EVENT",
      "CUSTOM",
    ])
    .optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  goalType: z.string().optional().nullable(),
  goalTarget: z.number().int().min(0).optional().nullable(),
  goalCurrent: z.number().int().min(0).optional(),
  channels: z
    .array(
      z.enum([
        "FACEBOOK",
        "INSTAGRAM",
        "TWITTER",
        "LINKEDIN",
        "TIKTOK",
        "YOUTUBE",
        "PINTEREST",
      ])
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const addCampaignAnalyticsSchema = z.object({
  campaignId: z.string(),
  date: z.string().datetime(),
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  conversions: z.number().int().min(0).default(0),
  spend: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  engagements: z.number().int().min(0).default(0),
  reach: z.number().int().min(0).default(0),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type AddCampaignAnalyticsInput = z.infer<typeof addCampaignAnalyticsSchema>
