"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Check,
  ArrowRight,
  Zap,
} from "lucide-react"

const PLANS = [
  {
    name: "Free",
    price: "฿0",
    period: "/month",
    features: ["1 organization", "2 team members", "100 AI generations/mo", "Basic analytics"],
    current: true,
  },
  {
    name: "Pro",
    price: "฿1,490",
    period: "/month",
    features: ["3 organizations", "10 team members", "Unlimited AI generations", "Advanced analytics", "Priority support", "Custom reports"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "฿5,990",
    period: "/month",
    features: ["Unlimited organizations", "Unlimited team members", "Unlimited AI generations", "White-label reports", "Dedicated support", "Custom integrations", "API access"],
  },
]

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader heading="Billing" description="Manage your subscription and billing" />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <Badge>Free</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are currently on the Free plan. Upgrade to unlock more features and higher limits.
          </p>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={`relative transition-shadow hover:shadow-md ${plan.popular ? "border-primary" : ""}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-3">
                  <Zap className="mr-1 h-3 w-3" />Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="pt-8">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade"}
                {!plan.current && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No payment method on file</p>
              <p className="text-xs text-muted-foreground">Add a payment method to upgrade your plan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
