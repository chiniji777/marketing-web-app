import {
  BarChart3,
  Bell,
  Calendar,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  children?: NavItem[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const dashboardNavigation: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "AI Content",
        href: "/content",
        icon: Sparkles,
        children: [
          { title: "Generator", href: "/content/generator", icon: Sparkles },
          { title: "Calendar", href: "/content/calendar", icon: Calendar },
          { title: "Templates", href: "/content/templates", icon: FileText },
        ],
      },
      {
        title: "Products",
        href: "/products",
        icon: Package,
      },
      {
        title: "Campaigns",
        href: "/campaigns",
        icon: Megaphone,
      },
      {
        title: "Ads Manager",
        href: "/ads",
        icon: Target,
      },
      {
        title: "Social Listening",
        href: "/social-listening",
        icon: Globe,
        children: [
          { title: "Mentions", href: "/social-listening/mentions", icon: Globe },
          { title: "Sentiment", href: "/social-listening/sentiment", icon: TrendingUp },
        ],
      },
    ],
  },
  {
    label: "Analyze",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        children: [
          { title: "All Reports", href: "/reports", icon: BarChart3 },
          { title: "Report Builder", href: "/reports/builder", icon: FileText },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]

export const adminNavigation: NavItem[] = [
  {
    title: "Admin Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Organizations",
    href: "/admin/organizations",
    icon: Globe,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
]
