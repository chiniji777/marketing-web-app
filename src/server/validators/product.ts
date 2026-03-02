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

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type UpdateProductMarketingDataInput = z.infer<typeof updateProductMarketingDataSchema>
