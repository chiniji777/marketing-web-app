import { z } from "zod"

export const generateContentSchema = z.object({
  contentType: z.enum([
    "SOCIAL_POST",
    "BLOG_POST",
    "AD_COPY",
    "EMAIL",
    "LANDING_PAGE",
    "VIDEO_SCRIPT",
  ]),
  topic: z.string().min(1, "Topic is required").max(500),
  tone: z.enum([
    "professional",
    "casual",
    "humorous",
    "urgent",
    "inspirational",
    "educational",
    "persuasive",
  ]),
  language: z.string().default("en"),
  platform: z
    .enum(["instagram", "facebook", "twitter", "linkedin", "tiktok", "general"])
    .optional(),
  keywords: z.string().optional(),
  additionalInstructions: z.string().max(1000).optional(),
  templateId: z.string().optional(),
  productId: z.string().optional(),
})

export const createContentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(1, "Content body is required"),
  contentType: z.enum([
    "SOCIAL_POST",
    "BLOG_POST",
    "AD_COPY",
    "EMAIL",
    "LANDING_PAGE",
    "VIDEO_SCRIPT",
  ]),
  tone: z.string().optional(),
  language: z.string().default("en"),
  aiGenerated: z.boolean().default(false),
  aiPrompt: z.string().optional(),
  featuredImage: z.string().optional(),
  campaignId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

export const updateContentSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  contentType: z
    .enum([
      "SOCIAL_POST",
      "BLOG_POST",
      "AD_COPY",
      "EMAIL",
      "LANDING_PAGE",
      "VIDEO_SCRIPT",
    ])
    .optional(),
  status: z
    .enum([
      "DRAFT",
      "PENDING_REVIEW",
      "APPROVED",
      "SCHEDULED",
      "PUBLISHED",
      "ARCHIVED",
    ])
    .optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
  campaignId: z.string().nullable().optional(),
})

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional(),
  contentType: z.enum([
    "SOCIAL_POST",
    "BLOG_POST",
    "AD_COPY",
    "EMAIL",
    "LANDING_PAGE",
    "VIDEO_SCRIPT",
  ]),
  body: z.string().min(1, "Template body is required"),
  variables: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        defaultValue: z.string().optional(),
      })
    )
    .optional(),
})

export type GenerateContentInput = z.infer<typeof generateContentSchema>
export type CreateContentInput = z.infer<typeof createContentSchema>
export type UpdateContentInput = z.infer<typeof updateContentSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
