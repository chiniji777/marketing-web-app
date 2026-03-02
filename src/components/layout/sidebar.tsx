"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { dashboardNavigation } from "@/config/navigation"
import { OrgSwitcher } from "./org-switcher"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "@/hooks/use-locale"
import type { TranslationDictionary } from "@/lib/i18n/types"

/** Map English nav labels/titles to their i18n keys */
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
  Generator: "generator",
  Calendar: "calendar",
  Templates: "templates",
  Campaigns: "campaigns",
  "Ads Manager": "adsManager",
  "Social Listening": "socialListening",
  Mentions: "mentions",
  Sentiment: "sentiment",
  "Leads & CRM": "leadsCrm",
  Pipeline: "pipeline",
  "Lead Forms": "leadForms",
  "Email Marketing": "emailMarketing",
  Compose: "compose",
  Subscribers: "subscribers",
  Automations: "automations",
  "SEO Tools": "seoTools",
  Keywords: "keywords",
  Rankings: "rankings",
  "Site Audit": "siteAudit",
  Reports: "reports",
  "All Reports": "allReports",
  "Report Builder": "reportBuilder",
  Notifications: "notifications",
  Settings: "settings",
}

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-sidebar">
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
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  t={t}
                />
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}

interface SidebarItemProps {
  item: (typeof dashboardNavigation)[number]["items"][number]
  pathname: string
  t: TranslationDictionary
}

function translateTitle(title: string, t: TranslationDictionary): string {
  const key = itemKeyMap[title]
  return key ? t.navItems[key] : title
}

function SidebarItem({ item, pathname, t }: SidebarItemProps) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const hasChildren = item.children && item.children.length > 0
  const [isOpen, setIsOpen] = useState(isActive)

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{translateTitle(item.title, t)}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.children?.map((child) => {
              const childActive = pathname === child.href
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                    childActive
                      ? "font-medium text-sidebar-primary"
                      : "text-muted-foreground hover:text-sidebar-foreground"
                  )}
                >
                  {translateTitle(child.title, t)}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{translateTitle(item.title, t)}</span>
    </Link>
  )
}
