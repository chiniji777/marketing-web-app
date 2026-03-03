import { describe, it, expect } from "vitest"
import { dashboardNavigation, adminNavigation } from "@/config/navigation"

describe("dashboardNavigation", () => {
  it("has the correct number of sections", () => {
    expect(dashboardNavigation).toHaveLength(4)
  })

  it("contains Overview, Marketing, Analyze, and System sections", () => {
    const labels = dashboardNavigation.map((s) => s.label)
    expect(labels).toEqual(["Overview", "Marketing", "Analyze", "System"])
  })

  it("does NOT include Engage section (leads/email removed)", () => {
    const labels = dashboardNavigation.map((s) => s.label)
    expect(labels).not.toContain("Engage")
  })

  it("does NOT include SEO in Analyze section", () => {
    const analyzeSection = dashboardNavigation.find((s) => s.label === "Analyze")
    expect(analyzeSection).toBeDefined()
    const titles = analyzeSection!.items.map((i) => i.title)
    expect(titles).not.toContain("SEO Tools")
  })

  it("Marketing section includes Products", () => {
    const marketing = dashboardNavigation.find((s) => s.label === "Marketing")
    expect(marketing).toBeDefined()
    const titles = marketing!.items.map((i) => i.title)
    expect(titles).toContain("Products")
  })

  it("Marketing section includes AI Content with children", () => {
    const marketing = dashboardNavigation.find((s) => s.label === "Marketing")
    const aiContent = marketing!.items.find((i) => i.title === "AI Content")
    expect(aiContent).toBeDefined()
    expect(aiContent!.children).toHaveLength(3)
    expect(aiContent!.children!.map((c) => c.title)).toEqual(["Generator", "Calendar", "Templates"])
  })

  it("Marketing section includes Social Listening with children", () => {
    const marketing = dashboardNavigation.find((s) => s.label === "Marketing")
    const social = marketing!.items.find((i) => i.title === "Social Listening")
    expect(social).toBeDefined()
    expect(social!.children).toHaveLength(2)
  })

  it("System section includes Notifications and Settings", () => {
    const system = dashboardNavigation.find((s) => s.label === "System")
    expect(system).toBeDefined()
    const titles = system!.items.map((i) => i.title)
    expect(titles).toContain("Notifications")
    expect(titles).toContain("Settings")
  })

  it("every nav item has title, href, and icon", () => {
    for (const section of dashboardNavigation) {
      for (const item of section.items) {
        expect(item.title).toBeTruthy()
        expect(item.href).toBeTruthy()
        expect(item.icon).toBeTruthy()
        if (item.children) {
          for (const child of item.children) {
            expect(child.title).toBeTruthy()
            expect(child.href).toBeTruthy()
            expect(child.icon).toBeTruthy()
          }
        }
      }
    }
  })
})

describe("adminNavigation", () => {
  it("has the correct items", () => {
    const titles = adminNavigation.map((i) => i.title)
    expect(titles).toEqual([
      "Admin Dashboard",
      "Organizations",
      "Users",
      "Analytics",
      "Subscriptions",
    ])
  })

  it("all admin items have href starting with /admin", () => {
    for (const item of adminNavigation) {
      expect(item.href).toMatch(/^\/admin/)
    }
  })
})
