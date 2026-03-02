import {
  BarChart3,
  Bell,
  Calendar,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Mail,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  ClipboardList,
  Send,
  BookTemplate,
  Ear,
  HeartPulse,
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
    label: "Engage",
    items: [
      {
        title: "Leads & CRM",
        href: "/leads",
        icon: Users,
        children: [
          { title: "Pipeline", href: "/leads", icon: Users },
          { title: "Lead Forms", href: "/leads/forms", icon: ClipboardList },
        ],
      },
      {
        title: "Email Marketing",
        href: "/email",
        icon: Mail,
        children: [
          { title: "Campaigns", href: "/email", icon: Mail },
          { title: "Compose", href: "/email/compose", icon: Send },
          { title: "Templates", href: "/email/templates", icon: FileText },
          { title: "Subscribers", href: "/email/subscribers", icon: Users },
          { title: "Automations", href: "/email/automations", icon: Zap },
        ],
      },
    ],
  },
  {
    label: "Analyze",
    items: [
      {
        title: "SEO Tools",
        href: "/seo",
        icon: Search,
        children: [
          { title: "Overview", href: "/seo", icon: Search },
          { title: "Keywords", href: "/seo/keywords", icon: FileText },
          { title: "Rankings", href: "/seo/rankings", icon: TrendingUp },
          { title: "Site Audit", href: "/seo/audit", icon: ClipboardList },
        ],
      },
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
