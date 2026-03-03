import { describe, it, expect } from "vitest"
import {
  connectSocialAccountSchema,
  schedulePostSchema,
  createMentionSchema,
} from "@/server/validators/social"

describe("connectSocialAccountSchema", () => {
  it("accepts valid Facebook connection", () => {
    const result = connectSocialAccountSchema.safeParse({
      platform: "FACEBOOK",
      platformAccountId: "fb_12345",
      accountName: "My Business Page",
      accessToken: "EAABxxxxxxxx",
    })
    expect(result.success).toBe(true)
  })

  it("accepts all valid platforms", () => {
    const platforms = ["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN", "TIKTOK", "YOUTUBE", "PINTEREST"]
    for (const platform of platforms) {
      const result = connectSocialAccountSchema.safeParse({
        platform,
        platformAccountId: "acc_123",
        accountName: "Account",
        accessToken: "token_abc",
      })
      expect(result.success).toBe(true)
    }
  })

  it("rejects invalid platform", () => {
    const result = connectSocialAccountSchema.safeParse({
      platform: "THREADS",
      platformAccountId: "acc_123",
      accountName: "Account",
      accessToken: "token_abc",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty accessToken", () => {
    const result = connectSocialAccountSchema.safeParse({
      platform: "FACEBOOK",
      platformAccountId: "fb_123",
      accountName: "Page",
      accessToken: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("schedulePostSchema", () => {
  it("accepts valid scheduling input", () => {
    const result = schedulePostSchema.safeParse({
      contentId: "content_123",
      socialAccountIds: ["account_1", "account_2"],
      scheduledAt: "2026-03-15T10:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty socialAccountIds", () => {
    const result = schedulePostSchema.safeParse({
      contentId: "content_123",
      socialAccountIds: [],
      scheduledAt: "2026-03-15T10:00:00Z",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid datetime", () => {
    const result = schedulePostSchema.safeParse({
      contentId: "content_123",
      socialAccountIds: ["account_1"],
      scheduledAt: "not-a-date",
    })
    expect(result.success).toBe(false)
  })
})

describe("createMentionSchema", () => {
  it("accepts valid mention", () => {
    const result = createMentionSchema.safeParse({
      platform: "FACEBOOK",
      authorName: "John Doe",
      authorHandle: "johndoe",
      content: "Great product!",
      sentiment: "POSITIVE",
      mentionedAt: "2026-03-04T12:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("accepts all sentiment values", () => {
    const sentiments = ["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"]
    for (const sentiment of sentiments) {
      const result = createMentionSchema.safeParse({
        platform: "TWITTER",
        content: "Test mention",
        sentiment,
        mentionedAt: "2026-03-04T12:00:00Z",
      })
      expect(result.success).toBe(true)
    }
  })

  it("rejects empty content", () => {
    const result = createMentionSchema.safeParse({
      platform: "FACEBOOK",
      content: "",
      mentionedAt: "2026-03-04T12:00:00Z",
    })
    expect(result.success).toBe(false)
  })

  it("defaults isCompetitor to false", () => {
    const result = createMentionSchema.safeParse({
      platform: "INSTAGRAM",
      content: "Nice post!",
      mentionedAt: "2026-03-04T12:00:00Z",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isCompetitor).toBe(false)
    }
  })

  it("validates URL format", () => {
    const result = createMentionSchema.safeParse({
      platform: "TWITTER",
      content: "Mention",
      url: "not-a-url",
      mentionedAt: "2026-03-04T12:00:00Z",
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid URL", () => {
    const result = createMentionSchema.safeParse({
      platform: "TWITTER",
      content: "Mention",
      url: "https://twitter.com/user/status/123",
      mentionedAt: "2026-03-04T12:00:00Z",
    })
    expect(result.success).toBe(true)
  })
})
