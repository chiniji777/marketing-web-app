import { z } from "zod"

export const addKeywordSchema = z.object({
  keyword: z.string().min(1).max(200),
  targetUrl: z.string().url().optional(),
  searchEngine: z.string().optional().default("google"),
  country: z.string().optional().default("US"),
  language: z.string().optional().default("en"),
})

export const runAuditSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(200).optional(),
})

export type AddKeywordInput = z.infer<typeof addKeywordSchema>
export type RunAuditInput = z.infer<typeof runAuditSchema>
