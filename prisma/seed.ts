import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

// Use direct TCP connection for seeding (bypasses Prisma Postgres HTTP proxy)
const connectionString = process.env.SEED_DATABASE_URL
  || "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // 1. Create Super Admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@marketpro.io" },
    update: {
      hashedPassword,
      isSuperAdmin: true,
    },
    create: {
      name: "Super Admin",
      email: "admin@marketpro.io",
      hashedPassword,
      isSuperAdmin: true,
      emailVerified: new Date(),
    },
  })
  console.log(`Admin user: ${admin.email} (id: ${admin.id})`)

  // 2. Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: "marketpro-hq" },
    update: {},
    create: {
      name: "MarketPro HQ",
      slug: "marketpro-hq",
    },
  })
  console.log(`Organization: ${org.name} (id: ${org.id})`)

  // 3. Create membership
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: org.id,
      },
    },
  })

  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        userId: admin.id,
        organizationId: org.id,
        role: "ADMIN",
      },
    })
    console.log("Created admin membership")
  } else {
    console.log("Membership already exists")
  }

  // 4. Sample campaigns
  const campaignData = [
    {
      id: "seed-q1-launch",
      name: "Q1 Product Launch",
      description: "Launch campaign for new AI features",
      status: "ACTIVE" as const,
      type: "PRODUCT_LAUNCH" as const,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-03-31"),
      budget: 15000,
      spentAmount: 8750,
      organizationId: org.id,
    },
    {
      id: "seed-summer-blitz",
      name: "Summer Social Media Blitz",
      description: "Increase brand awareness across social platforms",
      status: "DRAFT" as const,
      type: "BRAND_AWARENESS" as const,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-08-31"),
      budget: 25000,
      spentAmount: 0,
      organizationId: org.id,
    },
    {
      id: "seed-email-reeng",
      name: "Email Re-engagement",
      description: "Win back inactive subscribers with targeted content",
      status: "ACTIVE" as const,
      type: "ENGAGEMENT" as const,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-04-30"),
      budget: 5000,
      spentAmount: 2100,
      organizationId: org.id,
    },
  ]

  for (const c of campaignData) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    })
  }
  console.log(`Created ${campaignData.length} campaigns`)

  // 5. Sample contacts + leads
  const contactsAndLeads = [
    { firstName: "John", lastName: "Smith", email: "john@techcorp.com", company: "TechCorp", status: "QUALIFIED" as const, source: "Website", score: 85, stage: "qualified" },
    { firstName: "Sarah", lastName: "Johnson", email: "sarah@startup.io", company: "Startup.io", status: "NEW" as const, source: "Referral", score: 60, stage: "new" },
    { firstName: "Mike", lastName: "Chen", email: "mike@enterprise.com", company: "Enterprise Co", status: "CONTACTED" as const, source: "LinkedIn", score: 72, stage: "contacted" },
    { firstName: "Emily", lastName: "Davis", email: "emily@agency.co", company: "Creative Agency", status: "PROPOSAL" as const, source: "Website", score: 90, stage: "proposal" },
    { firstName: "Alex", lastName: "Turner", email: "alex@brand.com", company: "Brand Ltd", status: "NEGOTIATION" as const, source: "Event", score: 95, stage: "negotiation" },
  ]

  for (const cl of contactsAndLeads) {
    const contact = await prisma.contact.upsert({
      where: {
        organizationId_email: {
          organizationId: org.id,
          email: cl.email,
        },
      },
      update: {},
      create: {
        firstName: cl.firstName,
        lastName: cl.lastName,
        email: cl.email,
        company: cl.company,
        organizationId: org.id,
      },
    })

    const leadId = `seed-lead-${cl.email.split("@")[0]}`
    await prisma.lead.upsert({
      where: { id: leadId },
      update: {},
      create: {
        id: leadId,
        organizationId: org.id,
        contactId: contact.id,
        source: cl.source,
        status: cl.status,
        score: cl.score,
        pipelineStage: cl.stage,
      },
    })
  }
  console.log(`Created ${contactsAndLeads.length} contacts + leads`)

  // 6. Sample keywords for SEO
  const keywordData = [
    { keyword: "marketing automation", searchVolume: 12000, difficulty: 65, currentRank: 8 },
    { keyword: "AI marketing tools", searchVolume: 8500, difficulty: 45, currentRank: 3 },
    { keyword: "social media management", searchVolume: 22000, difficulty: 78, currentRank: 15 },
    { keyword: "email marketing platform", searchVolume: 18000, difficulty: 72, currentRank: 12 },
    { keyword: "lead generation software", searchVolume: 9800, difficulty: 55, currentRank: 6 },
  ]

  for (const kw of keywordData) {
    await prisma.keyword.upsert({
      where: {
        organizationId_keyword: {
          organizationId: org.id,
          keyword: kw.keyword,
        },
      },
      update: {},
      create: {
        ...kw,
        organizationId: org.id,
        isTracking: true,
      },
    })
  }
  console.log(`Created ${keywordData.length} keywords`)

  // 7. Sample notifications
  const notifData = [
    { type: "campaign", title: "Campaign Performance Alert", message: "Q1 Product Launch campaign CTR increased by 25% this week", isRead: false },
    { type: "lead", title: "New High-Value Lead", message: "Alex Turner from Brand Ltd scored 95 — ready for outreach", isRead: false },
    { type: "email", title: "Email Campaign Completed", message: "Re-engagement campaign sent to 2,500 subscribers with 32% open rate", isRead: true },
    { type: "seo", title: "Keyword Ranking Improved", message: "\"AI marketing tools\" moved from position 7 to position 3", isRead: false },
  ]

  for (const n of notifData) {
    await prisma.notification.create({
      data: {
        ...n,
        userId: admin.id,
        organizationId: org.id,
      },
    })
  }
  console.log(`Created ${notifData.length} notifications`)

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("Seed complete!")
  console.log("Admin login credentials:")
  console.log("  Email:    admin@marketpro.io")
  console.log("  Password: admin123")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
