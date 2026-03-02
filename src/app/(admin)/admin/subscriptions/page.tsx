"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  Check,
  Users,
  Building2,
  Zap,
} from "lucide-react"

const PLANS = [
  {
    name: "Free",
    price: "฿0",
    period: "/month",
    color: "border-gray-200",
    subscribers: 0,
    features: [
      "1 organization",
      "2 team members",
      "100 AI generations/month",
      "Basic analytics",
      "Community support",
    ],
  },
  {
    name: "Starter",
    price: "฿990",
    period: "/month",
    color: "border-blue-300",
    subscribers: 0,
    features: [
      "2 organizations",
      "5 team members",
      "500 AI generations/month",
      "Standard analytics",
      "Email support",
      "Social listening",
    ],
  },
  {
    name: "Pro",
    price: "฿2,490",
    period: "/month",
    color: "border-primary",
    popular: true,
    subscribers: 0,
    features: [
      "5 organizations",
      "20 team members",
      "Unlimited AI generations",
      "Advanced analytics",
      "Priority support",
      "Custom reports",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    price: "฿7,990",
    period: "/month",
    color: "border-purple-400",
    subscribers: 0,
    features: [
      "Unlimited organizations",
      "Unlimited team members",
      "Unlimited AI generations",
      "White-label reports",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "SSO/SAML",
    ],
  },
]

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader heading="Subscriptions" description="Manage subscription plans and pricing">
        <Button variant="outline" disabled>
          <CreditCard className="mr-2 h-4 w-4" />Stripe Dashboard
        </Button>
      </PageHeader>

      {/* Revenue Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-2xl font-bold">฿0</p>
            <p className="text-xs text-muted-foreground">Stripe not yet connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Free Users</p>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Churn Rate</p>
            <p className="text-2xl font-bold">0%</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.color}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3">
                    <Zap className="mr-1 h-3 w-3" />Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className={plan.popular ? "pt-8" : ""}>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {plan.subscribers} subscribers
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-4 w-full" disabled>
                  Edit Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stripe Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Not Connected</p>
              <p className="text-sm text-muted-foreground">
                Connect Stripe to enable subscription billing and payment processing
              </p>
            </div>
            <Button variant="outline" className="ml-auto" disabled>
              Connect Stripe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
