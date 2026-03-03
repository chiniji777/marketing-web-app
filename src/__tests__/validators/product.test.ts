import { describe, it, expect } from "vitest"
import {
  createProductSchema,
  updateProductSchema,
  updateProductMarketingDataSchema,
  createProductContentSchema,
  createProductEmailCampaignSchema,
} from "@/server/validators/product"

describe("createProductSchema", () => {
  it("accepts valid product", () => {
    const result = createProductSchema.safeParse({
      name: "My Product",
      description: "A great product",
      category: "Electronics",
      price: 99.99,
      currency: "THB",
    })
    expect(result.success).toBe(true)
  })

  it("accepts minimal product (name only)", () => {
    const result = createProductSchema.safeParse({ name: "Simple" })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createProductSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects name over 200 chars", () => {
    const result = createProductSchema.safeParse({ name: "x".repeat(201) })
    expect(result.success).toBe(false)
  })

  it("rejects negative price", () => {
    const result = createProductSchema.safeParse({ name: "Product", price: -10 })
    expect(result.success).toBe(false)
  })

  it("rejects zero price", () => {
    const result = createProductSchema.safeParse({ name: "Product", price: 0 })
    expect(result.success).toBe(false)
  })
})

describe("updateProductSchema", () => {
  it("accepts valid update", () => {
    const result = updateProductSchema.safeParse({
      id: "prod_123",
      name: "Updated Name",
      status: "ACTIVE",
    })
    expect(result.success).toBe(true)
  })

  it("accepts all valid statuses", () => {
    for (const status of ["DRAFT", "ACTIVE", "ARCHIVED"]) {
      const result = updateProductSchema.safeParse({ id: "prod_123", status })
      expect(result.success).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    const result = updateProductSchema.safeParse({ id: "prod_123", status: "DELETED" })
    expect(result.success).toBe(false)
  })
})

describe("updateProductMarketingDataSchema", () => {
  it("accepts full marketing data", () => {
    const result = updateProductMarketingDataSchema.safeParse({
      id: "prod_123",
      targetAudience: { ageRange: "25-35", gender: "all" },
      uniqueSellingPoints: ["Best quality", "Fast delivery"],
      painPoints: ["High cost of alternatives"],
      competitors: [{ name: "Competitor A", strengths: "Brand recognition" }],
      marketPosition: "Premium",
      brandVoice: "Professional and friendly",
      keyBenefits: ["Save time", "Save money"],
      keywords: ["productivity", "efficiency"],
      emotionalTriggers: ["confidence", "security"],
      seasonality: "All year",
      idealCustomerProfile: { role: "Manager", company: "SME" },
      marketingDataScore: 85,
    })
    expect(result.success).toBe(true)
  })

  it("accepts just id (no data to update)", () => {
    const result = updateProductMarketingDataSchema.safeParse({ id: "prod_123" })
    expect(result.success).toBe(true)
  })

  it("rejects marketing score over 100", () => {
    const result = updateProductMarketingDataSchema.safeParse({
      id: "prod_123",
      marketingDataScore: 101,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative marketing score", () => {
    const result = updateProductMarketingDataSchema.safeParse({
      id: "prod_123",
      marketingDataScore: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe("createProductContentSchema", () => {
  it("accepts valid product content", () => {
    const result = createProductContentSchema.safeParse({
      productId: "prod_123",
      title: "AI: Social Post",
      body: "Check out our new product!",
      contentType: "SOCIAL_POST",
      aiGenerated: true,
      aiPrompt: "Write a social post about product X",
    })
    expect(result.success).toBe(true)
  })

  it("requires productId", () => {
    const result = createProductContentSchema.safeParse({
      title: "Post",
      body: "Body",
      contentType: "SOCIAL_POST",
    })
    expect(result.success).toBe(false)
  })
})

describe("createProductEmailCampaignSchema", () => {
  it("accepts valid email campaign", () => {
    const result = createProductEmailCampaignSchema.safeParse({
      productId: "prod_123",
      name: "Welcome Email",
      subject: "Welcome to our product",
      htmlContent: "<h1>Welcome!</h1>",
      senderEmail: "hello@example.com",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid sender email", () => {
    const result = createProductEmailCampaignSchema.safeParse({
      productId: "prod_123",
      name: "Test",
      subject: "Test",
      htmlContent: "<p>Test</p>",
      senderEmail: "not-an-email",
    })
    expect(result.success).toBe(false)
  })
})
