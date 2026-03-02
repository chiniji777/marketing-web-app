import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Globe,
  Target,
  Megaphone,
  Users,
  Mail,
  Search,
  BarChart3,
  ArrowRight,
  Zap,
  Brain,
  TrendingUp,
  Calendar,
  PieChart,
  Shield,
  CheckCircle2,
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI Content Generator",
    description:
      "Create compelling social posts, blog articles, ad copy, and email content in seconds. Powered by GPT-4 with tone, style, and language controls.",
    highlights: [
      "Generate content in 20+ languages",
      "Adjust tone from professional to casual",
      "Template library with proven formats",
      "Streaming real-time generation",
    ],
  },
  {
    icon: Globe,
    title: "Social Listening",
    description:
      "Monitor what people say about your brand across all major social platforms. AI-powered sentiment analysis helps you understand the conversation.",
    highlights: [
      "Real-time brand mention tracking",
      "AI sentiment analysis",
      "Competitor monitoring",
      "Trend and spike detection",
    ],
  },
  {
    icon: Target,
    title: "AI Ads Manager",
    description:
      "Optimize your ad campaigns across Meta, Google, TikTok, and more. AI-powered budget allocation and audience targeting maximize your ROI.",
    highlights: [
      "Cross-platform campaign management",
      "AI budget optimization",
      "A/B testing built-in",
      "Audience targeting suggestions",
    ],
  },
  {
    icon: Megaphone,
    title: "Campaign Management",
    description:
      "Plan, execute, and track multi-channel marketing campaigns from a single dashboard. Set goals, manage budgets, and measure results.",
    highlights: [
      "Multi-channel campaign tracking",
      "Goal and budget management",
      "Campaign analytics dashboard",
      "Team collaboration tools",
    ],
  },
  {
    icon: Users,
    title: "Lead Management & CRM",
    description:
      "Capture, score, and nurture leads with a visual Kanban pipeline. AI-powered lead scoring helps you focus on the most promising prospects.",
    highlights: [
      "Drag-and-drop Kanban board",
      "AI lead scoring",
      "Lead capture form builder",
      "Activity timeline tracking",
    ],
  },
  {
    icon: Mail,
    title: "Email Marketing",
    description:
      "Build beautiful emails, set up automated drip campaigns, and track performance. A/B testing helps you optimize every send.",
    highlights: [
      "Email template builder",
      "Drip campaign automation",
      "Subscriber management",
      "Detailed analytics and A/B testing",
    ],
  },
  {
    icon: Search,
    title: "SEO Tools",
    description:
      "AI-powered keyword research, rank tracking, and site auditing. Get actionable content optimization suggestions to improve your search visibility.",
    highlights: [
      "Keyword research and tracking",
      "Rank position monitoring",
      "Automated site audits",
      "Content optimization scores",
    ],
  },
  {
    icon: BarChart3,
    title: "Custom Reports",
    description:
      "Build comprehensive marketing reports with drag-and-drop widgets. Export to PDF/CSV or schedule automated delivery to stakeholders.",
    highlights: [
      "Drag-and-drop report builder",
      "PDF and CSV export",
      "Scheduled report delivery",
      "White-label branding options",
    ],
  },
]

const platformFeatures = [
  { icon: Brain, label: "AI-Powered", description: "GPT-4 integrated throughout the platform" },
  { icon: Shield, label: "Multi-Tenant", description: "Manage multiple businesses from one account" },
  { icon: Zap, label: "Real-Time", description: "Live data and instant content generation" },
  { icon: PieChart, label: "Analytics", description: "Deep insights across all channels" },
  { icon: Calendar, label: "Scheduling", description: "Plan and automate your content calendar" },
  { icon: TrendingUp, label: "Growth", description: "Tools designed to scale with your business" },
]

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            MarketPro
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/features" className="text-sm font-medium text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center">
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
          Every tool you need.{" "}
          <span className="text-primary">One platform.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          MarketPro combines 10+ powerful marketing tools with AI at the core,
          giving you everything needed to grow your business.
        </p>
      </section>

      {/* Platform Highlights */}
      <section className="border-y bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {platformFeatures.map((f) => (
              <div key={f.label} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-3 font-semibold">{f.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Details */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="space-y-24">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`flex flex-col items-center gap-12 lg:flex-row ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-muted-foreground">{feature.description}</p>
                  <ul className="mt-6 space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex h-64 w-full max-w-md items-center justify-center rounded-2xl border bg-muted/50">
                    <feature.icon className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to transform your marketing?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start with our free plan and upgrade as you grow.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            MarketPro &copy; {new Date().getFullYear()}
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/features" className="hover:text-foreground">Features</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
