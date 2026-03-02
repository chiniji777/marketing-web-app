import { z } from "zod"

export const connectSocialAccountSchema = z.object({
  platform: z.enum([
    "FACEBOOK",
    "INSTAGRAM",
    "TWITTER",
    "LINKEDIN",
    "TIKTOK",
    "YOUTUBE",
    "PINTEREST",
  ]),
  platformAccountId: z.string().min(1),
  accountName: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const schedulePostSchema = z.object({
  contentId: z.string(),
  socialAccountIds: z.array(z.string()).min(1, "Select at least one account"),
  scheduledAt: z.string().datetime(),
})

export const createMentionSchema = z.object({
  platform: z.enum([
    "FACEBOOK",
    "INSTAGRAM",
    "TWITTER",
    "LINKEDIN",
    "TIKTOK",
    "YOUTUBE",
    "PINTEREST",
  ]),
  authorName: z.string().optional(),
  authorHandle: z.string().optional(),
  content: z.string().min(1),
  url: z.string().url().optional(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"]).optional(),
  sentimentScore: z.number().min(-1).max(1).optional(),
  isCompetitor: z.boolean().default(false),
  matchedKeyword: z.string().optional(),
  engagementCount: z.number().int().default(0),
  reachEstimate: z.number().int().optional(),
  mentionedAt: z.string().datetime(),
})

export type ConnectSocialAccountInput = z.infer<typeof connectSocialAccountSchema>
export type SchedulePostInput = z.infer<typeof schedulePostSchema>
export type CreateMentionInput = z.infer<typeof createMentionSchema>
