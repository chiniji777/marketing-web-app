import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  images: z.array(z.string()).optional(),
})

export const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
})

export const updateProductMarketingDataSchema = z.object({
  id: z.string(),
  targetAudience: z.record(z.string(), z.unknown()).optional(),
  uniqueSellingPoints: z.array(z.string()).optional(),
  painPoints: z.array(z.string()).optional(),
  competitors: z.array(z.record(z.string(), z.unknown())).optional(),
  marketPosition: z.string().optional(),
  brandVoice: z.string().optional(),
  keyBenefits: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  emotionalTriggers: z.array(z.string()).optional(),
  customerObjections: z.array(z.record(z.string(), z.unknown())).optional(),
  seasonality: z.string().optional(),
  idealCustomerProfile: z.record(z.string(), z.unknown()).optional(),
  aiConversation: z.array(z.record(z.string(), z.unknown())).optional(),
  marketingDataScore: z.number().min(0).max(100).optional(),
})

export const createProductContentSchema = z.object({
  productId: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  contentType: z.enum(["SOCIAL_POST", "BLOG_POST", "AD_COPY", "EMAIL", "LANDING_PAGE", "VIDEO_SCRIPT"]),
  tone: z.string().optional(),
  language: z.string().optional(),
  aiGenerated: z.boolean().optional(),
  aiPrompt: z.string().optional(),
  featuredImage: z.string().optional(),
})

export const createProductEmailCampaignSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().email().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type UpdateProductMarketingDataInput = z.infer<typeof updateProductMarketingDataSchema>
export type CreateProductContentInput = z.infer<typeof createProductContentSchema>
export type CreateProductEmailCampaignInput = z.infer<typeof createProductEmailCampaignSchema>
