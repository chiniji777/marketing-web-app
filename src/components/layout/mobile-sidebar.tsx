"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { dashboardNavigation } from "@/config/navigation"
import { OrgSwitcher } from "./org-switcher"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTranslations } from "@/hooks/use-locale"
import type { TranslationDictionary } from "@/lib/i18n/types"

const sectionKeyMap: Record<string, keyof TranslationDictionary["nav"]> = {
  Overview: "overview",
  Marketing: "marketing",
  Engage: "engage",
  Analyze: "analyze",
  System: "system",
}

const itemKeyMap: Record<string, keyof TranslationDictionary["navItems"]> = {
  Dashboard: "dashboard",
  "AI Content": "aiContent",
  Campaigns: "campaigns",
  "Ads Manager": "adsManager",
  "Social Listening": "socialListening",
  "Leads & CRM": "leadsCrm",
  "Email Marketing": "emailMarketing",
  "SEO Tools": "seoTools",
  Reports: "reports",
  Notifications: "notifications",
  Settings: "settings",
}

export function MobileSidebar() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-3">
        <OrgSwitcher />
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {dashboardNavigation.map((section) => (
            <div key={section.label} className="py-2">
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {sectionKeyMap[section.label]
                  ? t.nav[sectionKeyMap[section.label]]
                  : section.label}
              </p>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const key = itemKeyMap[item.title]
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{key ? t.navItems[key] : item.title}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
