import { z } from "zod"

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  socialProfiles: z.record(z.string(), z.unknown()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
})

export const updateContactSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
})

export const createLeadSchema = z.object({
  contactId: z.string().optional(),
  firstName: z.string().min(1, "Name is required"),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  sourceDetail: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  pipelineStage: z.string().default("new"),
})

export const updateLeadSchema = z.object({
  id: z.string(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "UNQUALIFIED"]).optional(),
  pipelineStage: z.string().optional(),
  score: z.number().int().min(0).optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedValue: z.number().min(0).optional().nullable(),
  source: z.string().optional(),
})

export const createLeadFormSchema = z.object({
  name: z.string().min(1, "Form name is required"),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox"]),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).min(1, "At least one field is required"),
  thankYouMessage: z.string().optional(),
  redirectUrl: z.string().url().optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type CreateLeadFormInput = z.infer<typeof createLeadFormSchema>
