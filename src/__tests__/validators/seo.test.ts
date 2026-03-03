import { describe, it, expect } from "vitest"
import { addKeywordSchema, runAuditSchema } from "@/server/validators/seo"

describe("addKeywordSchema", () => {
  it("accepts valid keyword", () => {
    const result = addKeywordSchema.safeParse({
      keyword: "marketing tools",
      targetUrl: "https://example.com/page",
    })
    expect(result.success).toBe(true)
  })

  it("sets defaults for optional fields", () => {
    const result = addKeywordSchema.safeParse({ keyword: "test" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.searchEngine).toBe("google")
      expect(result.data.country).toBe("US")
      expect(result.data.language).toBe("en")
    }
  })

  it("rejects empty keyword", () => {
    const result = addKeywordSchema.safeParse({ keyword: "" })
    expect(result.success).toBe(false)
  })

  it("rejects keyword over 200 chars", () => {
    const result = addKeywordSchema.safeParse({ keyword: "a".repeat(201) })
    expect(result.success).toBe(false)
  })

  it("rejects invalid URL", () => {
    const result = addKeywordSchema.safeParse({
      keyword: "test",
      targetUrl: "not-a-url",
    })
    expect(result.success).toBe(false)
  })
})

describe("runAuditSchema", () => {
  it("accepts valid audit request", () => {
    const result = runAuditSchema.safeParse({
      url: "https://example.com",
      name: "Homepage Audit",
    })
    expect(result.success).toBe(true)
  })

  it("requires URL", () => {
    const result = runAuditSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects invalid URL", () => {
    const result = runAuditSchema.safeParse({ url: "not-a-url" })
    expect(result.success).toBe(false)
  })
})
