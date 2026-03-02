import { z } from "zod"

export const createEmailCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject is required"),
  previewText: z.string().optional(),
  htmlContent: z.string().min(1, "Email content is required"),
  textContent: z.string().optional(),
  templateId: z.string().optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  scheduledAt: z.string().datetime().optional(),
  campaignId: z.string().optional(),
  automationType: z.string().optional(),
  automationConfig: z.string().optional(),
})

export const updateEmailCampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  previewText: z.string().optional().nullable(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED", "CANCELLED"]).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  senderName: z.string().optional(),
  senderEmail: z.string().email().optional(),
})

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.string().optional(),
  htmlContent: z.string().min(1, "Template content is required"),
})

export const addSubscriberSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  contactId: z.string().optional(),
})

export const bulkAddSubscribersSchema = z.object({
  subscribers: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })).min(1, "At least one subscriber is required"),
})

export type CreateEmailCampaignInput = z.infer<typeof createEmailCampaignSchema>
export type UpdateEmailCampaignInput = z.infer<typeof updateEmailCampaignSchema>
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>
export type AddSubscriberInput = z.infer<typeof addSubscriberSchema>
export type BulkAddSubscribersInput = z.infer<typeof bulkAddSubscribersSchema>
