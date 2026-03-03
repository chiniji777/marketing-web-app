import { describe, it, expect } from "vitest"
import {
  generateContentSchema,
  createContentSchema,
  updateContentSchema,
  createTemplateSchema,
} from "@/server/validators/content"

describe("generateContentSchema", () => {
  it("accepts valid input with all fields", () => {
    const result = generateContentSchema.safeParse({
      contentType: "SOCIAL_POST",
      topic: "Test topic",
      tone: "professional",
      language: "en",
      platform: "instagram",
      keywords: "test, keywords",
      additionalInstructions: "Be creative",
      productId: "clxyz123",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid input with only required fields", () => {
    const result = generateContentSchema.safeParse({
      contentType: "BLOG_POST",
      topic: "My blog topic",
      tone: "casual",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.language).toBe("en") // default
    }
  })

  it("accepts productId as optional", () => {
    const result = generateContentSchema.safeParse({
      contentType: "AD_COPY",
      topic: "Ad campaign",
      tone: "persuasive",
      productId: "prod_123",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.productId).toBe("prod_123")
    }
  })

  it("rejects empty topic", () => {
    const result = generateContentSchema.safeParse({
      contentType: "SOCIAL_POST",
      topic: "",
      tone: "professional",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid content type", () => {
    const result = generateContentSchema.safeParse({
      contentType: "INVALID_TYPE",
      topic: "Test",
      tone: "professional",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid tone", () => {
    const result = generateContentSchema.safeParse({
      contentType: "SOCIAL_POST",
      topic: "Test",
      tone: "angry",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid content types", () => {
    const types = ["SOCIAL_POST", "BLOG_POST", "AD_COPY", "EMAIL", "LANDING_PAGE", "VIDEO_SCRIPT"]
    for (const contentType of types) {
      const result = generateContentSchema.safeParse({
        contentType,
        topic: "Test",
        tone: "professional",
      })
      expect(result.success).toBe(true)
    }
  })

  it("accepts all valid platforms", () => {
    const platforms = ["instagram", "facebook", "twitter", "linkedin", "tiktok", "general"]
    for (const platform of platforms) {
      const result = generateContentSchema.safeParse({
        contentType: "SOCIAL_POST",
        topic: "Test",
        tone: "professional",
        platform,
      })
      expect(result.success).toBe(true)
    }
  })

  it("rejects topic over 500 chars", () => {
    const result = generateContentSchema.safeParse({
      contentType: "SOCIAL_POST",
      topic: "a".repeat(501),
      tone: "professional",
    })
    expect(result.success).toBe(false)
  })
})

describe("createContentSchema", () => {
  it("accepts valid input", () => {
    const result = createContentSchema.safeParse({
      title: "My Post",
      body: "This is the content body",
      contentType: "SOCIAL_POST",
    })
    expect(result.success).toBe(true)
  })

  it("sets defaults for optional fields", () => {
    const result = createContentSchema.safeParse({
      title: "Test",
      body: "Body",
      contentType: "BLOG_POST",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.language).toBe("en")
      expect(result.data.aiGenerated).toBe(false)
    }
  })

  it("accepts AI-generated content", () => {
    const result = createContentSchema.safeParse({
      title: "AI: Generated Post",
      body: "AI created this",
      contentType: "SOCIAL_POST",
      aiGenerated: true,
      aiPrompt: "Write a social post about...",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.aiGenerated).toBe(true)
    }
  })

  it("rejects empty title", () => {
    const result = createContentSchema.safeParse({
      title: "",
      body: "Content",
      contentType: "SOCIAL_POST",
    })
    expect(result.success).toBe(false)
  })

  it("rejects title over 200 chars", () => {
    const result = createContentSchema.safeParse({
      title: "a".repeat(201),
      body: "Content",
      contentType: "SOCIAL_POST",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateContentSchema", () => {
  it("accepts valid update with only id", () => {
    const result = updateContentSchema.safeParse({ id: "content_123" })
    expect(result.success).toBe(true)
  })

  it("accepts valid status updates", () => {
    const statuses = ["DRAFT", "PENDING_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"]
    for (const status of statuses) {
      const result = updateContentSchema.safeParse({ id: "content_123", status })
      expect(result.success).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    const result = updateContentSchema.safeParse({ id: "content_123", status: "DELETED" })
    expect(result.success).toBe(false)
  })
})

describe("createTemplateSchema", () => {
  it("accepts valid template", () => {
    const result = createTemplateSchema.safeParse({
      name: "Social Post Template",
      description: "Template for social media posts",
      contentType: "SOCIAL_POST",
      body: "Hello {{name}}, check out {{product}}!",
      variables: [
        { name: "name", description: "Customer name" },
        { name: "product", description: "Product name", defaultValue: "our product" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rejects template without name", () => {
    const result = createTemplateSchema.safeParse({
      name: "",
      contentType: "SOCIAL_POST",
      body: "Template body",
    })
    expect(result.success).toBe(false)
  })
})
