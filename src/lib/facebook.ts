const FB_API_VERSION = "v24.0"
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`

interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

interface FacebookAdAccountRaw {
  id: string
  name: string
  account_status: number
  currency: string
  timezone_name: string
  business?: { id: string; name: string }
}

export interface FacebookAdAccountInfo {
  adAccountId: string
  name: string
  accountStatus: number
  currency: string
  timezone: string
  businessId?: string
  businessName?: string
}

interface FacebookCampaignRaw {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: string
  lifetime_budget?: string
  created_time: string
  updated_time: string
}

export interface FacebookCampaign {
  id: string
  name: string
  status: string
  objective: string
  dailyBudget?: number
  lifetimeBudget?: number
  createdTime: string
  updatedTime: string
}

interface FacebookInsightsRaw {
  impressions: string
  clicks: string
  spend: string
  cpc?: string
  cpm?: string
  ctr?: string
  reach?: string
  actions?: Array<{ action_type: string; value: string }>
  date_start: string
  date_stop: string
}

export interface FacebookInsights {
  impressions: number
  clicks: number
  spend: number
  cpc: number
  cpm: number
  ctr: number
  reach: number
  actions: Array<{ actionType: string; value: number }>
  dateStart: string
  dateStop: string
}

// ─── OAuth Flow ─────────────────────────────────────────────

export function getFacebookOAuthUrl(redirectUri: string, state: string): string {
  const appId = process.env.FACEBOOK_APP_ID
  if (!appId) throw new Error("FACEBOOK_APP_ID is not set")

  const scopes = "ads_management,ads_read,business_management,public_profile,pages_show_list,pages_read_engagement"
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    state,
  })

  return `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<FacebookTokenResponse> {
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  if (!appId || !appSecret) throw new Error("Facebook app credentials not configured")

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })

  const res = await fetch(`${FB_GRAPH_URL}/oauth/access_token?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Facebook token exchange failed: ${err.error?.message || res.statusText}`)
  }

  return res.json() as Promise<FacebookTokenResponse>
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<FacebookTokenResponse> {
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  if (!appId || !appSecret) throw new Error("Facebook app credentials not configured")

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  })

  const res = await fetch(`${FB_GRAPH_URL}/oauth/access_token?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Facebook long-lived token exchange failed: ${err.error?.message || res.statusText}`)
  }

  return res.json() as Promise<FacebookTokenResponse>
}

// ─── Graph API Helpers ──────────────────────────────────────

async function fbGet<T>(path: string, accessToken: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${FB_GRAPH_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  url.searchParams.set("access_token", accessToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Facebook API error: ${err.error?.message || res.statusText}`)
  }

  return res.json() as Promise<T>
}

async function fbPost<T>(path: string, accessToken: string, body: Record<string, unknown>): Promise<T> {
  const url = `${FB_GRAPH_URL}${path}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Facebook API error: ${err.error?.message || res.statusText}`)
  }

  return res.json() as Promise<T>
}

// ─── User / Account ─────────────────────────────────────────

export async function getFacebookUser(accessToken: string) {
  return fbGet<{ id: string; name: string; email?: string }>("/me", accessToken, {
    fields: "id,name,email",
  })
}

export async function getAdAccounts(accessToken: string): Promise<FacebookAdAccountInfo[]> {
  const result = await fbGet<{ data: FacebookAdAccountRaw[] }>("/me/adaccounts", accessToken, {
    fields: "id,name,account_status,currency,timezone_name,business{id,name}",
    limit: "100",
  })

  return result.data.map((acc) => ({
    adAccountId: acc.id,
    name: acc.name,
    accountStatus: acc.account_status,
    currency: acc.currency,
    timezone: acc.timezone_name,
    businessId: acc.business?.id,
    businessName: acc.business?.name,
  }))
}

// ─── Campaigns ──────────────────────────────────────────────

export async function getCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<FacebookCampaign[]> {
  const result = await fbGet<{ data: FacebookCampaignRaw[] }>(
    `/${adAccountId}/campaigns`,
    accessToken,
    {
      fields: "id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time",
      limit: "100",
    }
  )

  return result.data.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    objective: c.objective,
    dailyBudget: c.daily_budget ? parseInt(c.daily_budget) / 100 : undefined,
    lifetimeBudget: c.lifetime_budget ? parseInt(c.lifetime_budget) / 100 : undefined,
    createdTime: c.created_time,
    updatedTime: c.updated_time,
  }))
}

export async function createCampaign(
  adAccountId: string,
  accessToken: string,
  params: {
    name: string
    objective: string
    status?: string
    dailyBudget?: number
    specialAdCategories?: string[]
  }
): Promise<{ id: string }> {
  return fbPost(`/${adAccountId}/campaigns`, accessToken, {
    name: params.name,
    objective: params.objective,
    status: params.status || "PAUSED",
    special_ad_categories: params.specialAdCategories || [],
    ...(params.dailyBudget ? { daily_budget: Math.round(params.dailyBudget * 100) } : {}),
  })
}

export async function updateCampaign(
  campaignId: string,
  accessToken: string,
  params: {
    name?: string
    status?: string
    dailyBudget?: number
  }
): Promise<{ success: boolean }> {
  const body: Record<string, unknown> = {}
  if (params.name) body.name = params.name
  if (params.status) body.status = params.status
  if (params.dailyBudget) body.daily_budget = Math.round(params.dailyBudget * 100)

  return fbPost(`/${campaignId}`, accessToken, body)
}

// ─── Facebook Pages ──────────────────────────────────────────

export interface FacebookPage {
  id: string
  name: string
  accessToken: string
}

export async function getPages(accessToken: string): Promise<FacebookPage[]> {
  const result = await fbGet<{ data: Array<{ id: string; name: string; access_token: string }> }>(
    "/me/accounts",
    accessToken,
    { fields: "id,name,access_token", limit: "100" }
  )
  return result.data.map((p) => ({ id: p.id, name: p.name, accessToken: p.access_token }))
}

// ─── Delete Object ──────────────────────────────────────────

export async function deleteObject(
  objectId: string,
  accessToken: string
): Promise<{ success: boolean }> {
  const url = `${FB_GRAPH_URL}/${objectId}`
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Facebook API error: ${err.error?.message || res.statusText}`)
  }
  return { success: true }
}

// ─── Ad Sets ────────────────────────────────────────────────

interface FacebookAdSetRaw {
  id: string
  name: string
  status: string
  campaign_id: string
  daily_budget?: string
  lifetime_budget?: string
  billing_event: string
  optimization_goal: string
  targeting?: Record<string, unknown>
  start_time?: string
  end_time?: string
  created_time: string
  updated_time: string
}

export interface FacebookAdSet {
  id: string
  name: string
  status: string
  campaignId: string
  dailyBudget?: number
  lifetimeBudget?: number
  billingEvent: string
  optimizationGoal: string
  targeting?: Record<string, unknown>
  startTime?: string
  endTime?: string
  createdTime: string
  updatedTime: string
}

export async function getAdSets(
  campaignId: string,
  accessToken: string
): Promise<FacebookAdSet[]> {
  const result = await fbGet<{ data: FacebookAdSetRaw[] }>(
    `/${campaignId}/adsets`,
    accessToken,
    {
      fields: "id,name,status,campaign_id,daily_budget,lifetime_budget,billing_event,optimization_goal,targeting,start_time,end_time,created_time,updated_time",
      limit: "100",
    }
  )
  return result.data.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    campaignId: s.campaign_id,
    dailyBudget: s.daily_budget ? parseInt(s.daily_budget) / 100 : undefined,
    lifetimeBudget: s.lifetime_budget ? parseInt(s.lifetime_budget) / 100 : undefined,
    billingEvent: s.billing_event,
    optimizationGoal: s.optimization_goal,
    targeting: s.targeting,
    startTime: s.start_time,
    endTime: s.end_time,
    createdTime: s.created_time,
    updatedTime: s.updated_time,
  }))
}

export async function updateAdSet(
  adSetId: string,
  accessToken: string,
  params: {
    name?: string
    status?: string
    dailyBudget?: number
    targeting?: Record<string, unknown>
  }
): Promise<{ success: boolean }> {
  const body: Record<string, unknown> = {}
  if (params.name) body.name = params.name
  if (params.status) body.status = params.status
  if (params.dailyBudget) body.daily_budget = Math.round(params.dailyBudget * 100)
  if (params.targeting) body.targeting = params.targeting
  return fbPost(`/${adSetId}`, accessToken, body)
}

export async function createAdSet(
  adAccountId: string,
  accessToken: string,
  params: {
    name: string
    campaignId: string
    dailyBudget?: number
    billingEvent?: string
    optimizationGoal?: string
    targeting: Record<string, unknown>
    startTime?: string
    status?: string
  }
): Promise<{ id: string }> {
  return fbPost(`/${adAccountId}/adsets`, accessToken, {
    name: params.name,
    campaign_id: params.campaignId,
    billing_event: params.billingEvent || "IMPRESSIONS",
    optimization_goal: params.optimizationGoal || "LINK_CLICKS",
    targeting: params.targeting,
    status: params.status || "PAUSED",
    ...(params.dailyBudget ? { daily_budget: Math.round(params.dailyBudget * 100) } : {}),
    ...(params.startTime ? { start_time: params.startTime } : {}),
  })
}

// ─── Ads ────────────────────────────────────────────────────

interface FacebookAdRaw {
  id: string
  name: string
  status: string
  adset_id: string
  creative?: { id: string }
  created_time: string
  updated_time: string
}

export interface FacebookAd {
  id: string
  name: string
  status: string
  adSetId: string
  creativeId?: string
  createdTime: string
  updatedTime: string
}

export async function getAds(
  adSetId: string,
  accessToken: string
): Promise<FacebookAd[]> {
  const result = await fbGet<{ data: FacebookAdRaw[] }>(
    `/${adSetId}/ads`,
    accessToken,
    {
      fields: "id,name,status,adset_id,creative{id},created_time,updated_time",
      limit: "100",
    }
  )
  return result.data.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    adSetId: a.adset_id,
    creativeId: a.creative?.id,
    createdTime: a.created_time,
    updatedTime: a.updated_time,
  }))
}

export async function updateAd(
  adId: string,
  accessToken: string,
  params: { name?: string; status?: string }
): Promise<{ success: boolean }> {
  const body: Record<string, unknown> = {}
  if (params.name) body.name = params.name
  if (params.status) body.status = params.status
  return fbPost(`/${adId}`, accessToken, body)
}

export async function createAd(
  adAccountId: string,
  accessToken: string,
  params: {
    name: string
    adSetId: string
    creativeId: string
    status?: string
  }
): Promise<{ id: string }> {
  return fbPost(`/${adAccountId}/ads`, accessToken, {
    name: params.name,
    adset_id: params.adSetId,
    creative: { creative_id: params.creativeId },
    status: params.status || "PAUSED",
  })
}

// ─── Ad Creatives ───────────────────────────────────────────

export async function createAdCreative(
  adAccountId: string,
  accessToken: string,
  params: {
    name: string
    pageId: string
    message?: string
    link?: string
    imageHash?: string
    callToAction?: { type: string; value: { link: string } }
  }
): Promise<{ id: string }> {
  return fbPost(`/${adAccountId}/adcreatives`, accessToken, {
    name: params.name,
    object_story_spec: {
      page_id: params.pageId,
      link_data: {
        message: params.message || "",
        link: params.link || "",
        ...(params.imageHash ? { image_hash: params.imageHash } : {}),
        ...(params.callToAction ? { call_to_action: params.callToAction } : {}),
      },
    },
  })
}

// ─── Insights ───────────────────────────────────────────────

export async function getInsights(
  objectId: string,
  accessToken: string,
  params?: {
    timeRange?: { since: string; until: string }
    timeIncrement?: string
    level?: string
  }
): Promise<FacebookInsights[]> {
  const queryParams: Record<string, string> = {
    fields: "impressions,clicks,spend,cpc,cpm,ctr,reach,actions",
  }

  if (params?.timeRange) {
    queryParams.time_range = JSON.stringify(params.timeRange)
  }
  if (params?.timeIncrement) {
    queryParams.time_increment = params.timeIncrement
  }
  if (params?.level) {
    queryParams.level = params.level
  }

  const result = await fbGet<{ data: FacebookInsightsRaw[] }>(
    `/${objectId}/insights`,
    accessToken,
    queryParams
  )

  return result.data.map((i) => ({
    impressions: parseInt(i.impressions) || 0,
    clicks: parseInt(i.clicks) || 0,
    spend: parseFloat(i.spend) || 0,
    cpc: parseFloat(i.cpc || "0"),
    cpm: parseFloat(i.cpm || "0"),
    ctr: parseFloat(i.ctr || "0"),
    reach: parseInt(i.reach || "0"),
    actions: (i.actions || []).map((a) => ({
      actionType: a.action_type,
      value: parseInt(a.value),
    })),
    dateStart: i.date_start,
    dateStop: i.date_stop,
  }))
}
