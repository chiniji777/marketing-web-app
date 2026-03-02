import type { PlanType } from "@/generated/prisma/client"

interface PlanFeature {
  name: string
  included: boolean
  limit?: string
}

interface Plan {
  type: PlanType
  name: string
  description: string
  price: number
  priceYearly: number
  features: PlanFeature[]
  limits: {
    members: number
    socialAccounts: number
    postsPerMonth: number
    aiCreditsPerMonth: number
    campaigns: number
    leads: number
    emailsPerMonth: number
  }
}

export const plans: Plan[] = [
  {
    type: "FREE",
    name: "Free",
    description: "Get started with basic marketing tools",
    price: 0,
    priceYearly: 0,
    features: [
      { name: "AI Content Generator", included: true, limit: "10/month" },
      { name: "Social Listening", included: true, limit: "1 keyword" },
      { name: "Content Calendar", included: true },
      { name: "Basic Analytics", included: true },
      { name: "Ads Manager", included: false },
      { name: "Email Marketing", included: false },
      { name: "SEO Tools", included: false },
      { name: "Custom Reports", included: false },
    ],
    limits: {
      members: 1,
      socialAccounts: 2,
      postsPerMonth: 30,
      aiCreditsPerMonth: 10,
      campaigns: 2,
      leads: 100,
      emailsPerMonth: 0,
    },
  },
  {
    type: "STARTER",
    name: "Starter",
    description: "For small businesses getting serious about marketing",
    price: 29,
    priceYearly: 290,
    features: [
      { name: "AI Content Generator", included: true, limit: "100/month" },
      { name: "Social Listening", included: true, limit: "10 keywords" },
      { name: "Content Calendar", included: true },
      { name: "Analytics Dashboard", included: true },
      { name: "Ads Manager", included: true },
      { name: "Email Marketing", included: true, limit: "1,000/month" },
      { name: "SEO Tools", included: true, limit: "Basic" },
      { name: "Custom Reports", included: false },
    ],
    limits: {
      members: 3,
      socialAccounts: 5,
      postsPerMonth: 150,
      aiCreditsPerMonth: 100,
      campaigns: 10,
      leads: 1000,
      emailsPerMonth: 1000,
    },
  },
  {
    type: "PRO",
    name: "Pro",
    description: "For growing teams that need advanced features",
    price: 79,
    priceYearly: 790,
    features: [
      { name: "AI Content Generator", included: true, limit: "Unlimited" },
      { name: "Social Listening", included: true, limit: "50 keywords" },
      { name: "Content Calendar", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Ads Manager", included: true },
      { name: "Email Marketing", included: true, limit: "10,000/month" },
      { name: "SEO Tools", included: true, limit: "Advanced" },
      { name: "Custom Reports", included: true },
    ],
    limits: {
      members: 10,
      socialAccounts: 15,
      postsPerMonth: 500,
      aiCreditsPerMonth: 500,
      campaigns: 50,
      leads: 10000,
      emailsPerMonth: 10000,
    },
  },
  {
    type: "ENTERPRISE",
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: 199,
    priceYearly: 1990,
    features: [
      { name: "AI Content Generator", included: true, limit: "Unlimited" },
      { name: "Social Listening", included: true, limit: "Unlimited" },
      { name: "Content Calendar", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Ads Manager", included: true },
      { name: "Email Marketing", included: true, limit: "Unlimited" },
      { name: "SEO Tools", included: true, limit: "Full Suite" },
      { name: "Custom Reports", included: true },
    ],
    limits: {
      members: -1,
      socialAccounts: -1,
      postsPerMonth: -1,
      aiCreditsPerMonth: -1,
      campaigns: -1,
      leads: -1,
      emailsPerMonth: -1,
    },
  },
]

export function getPlan(type: PlanType): Plan {
  return plans.find((p) => p.type === type) ?? plans[0]
}
