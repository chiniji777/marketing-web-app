import { z } from "zod"

export const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["CAMPAIGN", "SOCIAL", "ADS", "EMAIL", "SEO", "LEADS", "CUSTOM", "OVERVIEW"]),
  dateRange: z.string().optional().default("30d"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metrics: z.array(z.string()).optional(),
  filters: z.string().optional(),
})

export const updateReportSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateReportInput = z.infer<typeof updateReportSchema>
