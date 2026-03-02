import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "฿0",
    period: "forever",
    description: "Get started with essential marketing tools",
    popular: false,
    features: [
      "1 organization",
      "2 team members",
      "AI content generator (50/month)",
      "Basic social listening",
      "Up to 500 contacts",
      "1,000 email sends/month",
      "5 keywords tracked",
      "Basic reports",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Starter",
    price: "฿990",
    period: "/month",
    description: "For growing businesses ready to scale",
    popular: false,
    features: [
      "2 organizations",
      "5 team members",
      "AI content generator (500/month)",
      "Social listening + sentiment",
      "Up to 5,000 contacts",
      "10,000 email sends/month",
      "50 keywords tracked",
      "Custom reports + export",
      "Ad campaign management",
      "Lead scoring",
    ],
    cta: "Start Free Trial",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "฿2,490",
    period: "/month",
    description: "Advanced tools for marketing teams",
    popular: true,
    features: [
      "5 organizations",
      "Unlimited team members",
      "AI content generator (unlimited)",
      "Advanced social listening",
      "Unlimited contacts",
      "50,000 email sends/month",
      "200 keywords tracked",
      "White-label reports",
      "AI ads optimization",
      "Email automations",
      "SEO site audits",
      "Priority support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Custom solutions for large organizations",
    popular: false,
    features: [
      "Unlimited organizations",
      "Unlimited team members",
      "All Pro features",
      "Custom AI model training",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom integrations",
      "SSO / SAML",
      "Audit logs",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
  },
]

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we prorate the billing.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes, all paid plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    q: "What happens when I exceed my plan limits?",
    a: "We'll notify you when you're approaching limits. You can upgrade your plan or purchase add-ons for additional capacity.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes, annual billing saves you 20% compared to monthly billing. Contact us for annual pricing.",
  },
]

export default function PricingPage() {
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
            <Link href="/pricing" className="text-sm font-medium text-foreground">
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
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Start free and scale as you grow. No hidden fees, no surprises.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.ctaVariant}
                  asChild
                >
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/register"}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-12 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
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
