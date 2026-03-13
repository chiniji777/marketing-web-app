export type Locale = "en" | "th"

export interface TranslationDictionary {
  // Navigation sections
  nav: {
    overview: string
    marketing: string
    engage: string
    analyze: string
    system: string
  }
  // Navigation items
  navItems: {
    dashboard: string
    aiContent: string
    generator: string
    calendar: string
    templates: string
    campaigns: string
    adsManager: string
    adsDashboard: string
    allCampaigns: string
    createCampaign: string
    socialListening: string
    mentions: string
    sentiment: string
    leadsCrm: string
    pipeline: string
    leadForms: string
    emailMarketing: string
    compose: string
    subscribers: string
    automations: string
    seoTools: string
    keywords: string
    rankings: string
    siteAudit: string
    reports: string
    allReports: string
    reportBuilder: string
    notifications: string
    products: string
    settings: string
  }
  // Admin navigation
  adminNav: {
    adminDashboard: string
    organizations: string
    users: string
    analytics: string
    subscriptions: string
  }
  // Common UI
  common: {
    search: string
    searchPlaceholder: string
    create: string
    edit: string
    delete: string
    cancel: string
    save: string
    loading: string
    noData: string
    viewAll: string
    exportCsv: string
    exportPdf: string
    filter: string
    sortBy: string
    status: string
    actions: string
    name: string
    email: string
    date: string
    type: string
    total: string
    active: string
    inactive: string
    all: string
    confirm: string
    back: string
    next: string
    previous: string
    language: string
    english: string
    thai: string
  }
  // Dashboard
  dashboard: {
    title: string
    subtitle: string
    totalCampaigns: string
    activeCampaigns: string
    totalLeads: string
    conversionRate: string
    revenue: string
    recentCampaigns: string
    quickActions: string
    performance: string
    thisMonth: string
    lastMonth: string
  }
  // Campaigns
  campaigns: {
    title: string
    subtitle: string
    createCampaign: string
    campaignName: string
    budget: string
    spent: string
    startDate: string
    endDate: string
    statusActive: string
    statusPaused: string
    statusCompleted: string
    statusDraft: string
    noCampaigns: string
  }
  // Leads
  leads: {
    title: string
    subtitle: string
    addLead: string
    totalLeads: string
    pipelineValue: string
    qualified: string
    conversionRate: string
    kanban: string
    list: string
    new: string
    contacted: string
    negotiation: string
    won: string
    lost: string
    score: string
    noLeads: string
    readyForOutreach: string
  }
  // Email Marketing
  emailMarketing: {
    title: string
    subtitle: string
    newCampaign: string
    totalCampaigns: string
    totalSubscribers: string
    avgOpenRate: string
    avgClickRate: string
    sent: string
    scheduled: string
    draft: string
    noCampaigns: string
    createFirst: string
  }
  // SEO
  seo: {
    title: string
    subtitle: string
    keywordsTracked: string
    avgRank: string
    improved: string
    lastAuditScore: string
    recentKeywords: string
    recentAudits: string
    noAuditsYet: string
    addKeyword: string
    runAudit: string
    movedUp: string
    acrossAllKeywords: string
  }
  // Reports
  reports: {
    title: string
    subtitle: string
    createReport: string
    noReports: string
    generateCustom: string
  }
  // Social Listening
  social: {
    title: string
    subtitle: string
    totalMentions: string
    positiveSentiment: string
    negativeSentiment: string
    avgSentiment: string
  }
  // Ads Manager
  ads: {
    title: string
    subtitle: string
    createCampaign: string
    totalCampaigns: string
    totalSpend: string
    avgCtr: string
    conversions: string
  }
  // Content
  content: {
    title: string
    subtitle: string
    generateContent: string
    contentCalendar: string
    totalContent: string
    published: string
    scheduled: string
    drafts: string
  }
  // Notifications
  notif: {
    title: string
    markAllRead: string
    noNotifications: string
    unread: string
  }
  // Settings
  settings: {
    title: string
    general: string
    profile: string
    team: string
    billing: string
    integrations: string
  }
  // Auth
  auth: {
    signIn: string
    signOut: string
    signUp: string
    email: string
    password: string
    forgotPassword: string
    orContinueWith: string
    noAccount: string
    haveAccount: string
  }
}
