import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Globe,
  Mail,
  Megaphone,
  Search,
  Sparkles,
  Target,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI Content Generator",
    description: "Create engaging social posts, blog articles, and ad copy powered by GPT-4",
  },
  {
    icon: Globe,
    title: "Social Listening",
    description: "Monitor brand mentions and sentiment across all social platforms in real-time",
  },
  {
    icon: Target,
    title: "AI Ads Manager",
    description: "Optimize ad campaigns with AI-powered budget allocation and audience targeting",
  },
  {
    icon: Megaphone,
    title: "Campaign Management",
    description: "Plan, execute, and track multi-channel marketing campaigns",
  },
  {
    icon: Users,
    title: "Lead Management & CRM",
    description: "Capture, score, and nurture leads with AI-powered pipeline management",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    description: "Build, automate, and analyze email campaigns with drag-and-drop builder",
  },
  {
    icon: Search,
    title: "SEO Tools",
    description: "AI-powered keyword research, rank tracking, and content optimization",
  },
  {
    icon: BarChart3,
    title: "Custom Reports",
    description: "Build white-label reports with automated delivery and PDF/CSV export",
  },
]

export default function LandingPage() {
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
            <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
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
      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center lg:py-32">
        <div className="mb-4 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          AI-Powered Marketing Platform
        </div>
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          All your marketing tools.
          <br />
          <span className="text-primary">One powerful platform.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Social listening, AI content generation, ads management, CRM, email marketing,
          and SEO tools — everything you need to grow your business, powered by AI.
        </p>
        <div className="mt-8 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/register">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/features">See Features</Link>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free plan available
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Multi-business support
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need to dominate your market
            </h2>
            <p className="mt-3 text-muted-foreground">
              10+ powerful tools designed for modern marketers
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to supercharge your marketing?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of businesses using MarketPro to grow their brand
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
