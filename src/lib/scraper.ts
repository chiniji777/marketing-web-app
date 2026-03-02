export interface ScrapedMention {
  platform: string
  authorName: string | null
  authorHandle: string | null
  content: string
  url: string
  engagementCount: number
  mentionedAt: string
}

interface ScrapeOptions {
  keywords: string[]
  platforms: string[]
  maxResults?: number
}

async function getCrawler() {
  try {
    const { PlaywrightCrawler } = await import("@crawlee/playwright")
    return PlaywrightCrawler
  } catch {
    return null
  }
}

// ─── Twitter/X Scraper ───────────────────────────────────────

async function scrapeTwitter(
  keywords: string[],
  maxResults: number
): Promise<ScrapedMention[]> {
  const PlaywrightCrawler = await getCrawler()
  if (!PlaywrightCrawler) throw new Error("Scraping not available in serverless environment")

  const mentions: ScrapedMention[] = []

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: maxResults,
    headless: true,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ page, request }) {
      await page.waitForTimeout(2000)

      const tweets = await page.$$eval("article[data-testid='tweet']", (articles) =>
        articles.slice(0, 10).map((article) => {
          const nameEl = article.querySelector("[data-testid='User-Name']")
          const contentEl = article.querySelector("[data-testid='tweetText']")
          const timeEl = article.querySelector("time")
          const linkEl = article.querySelector("a[href*='/status/']")

          return {
            authorName: nameEl?.querySelector("span")?.textContent ?? null,
            authorHandle: nameEl?.querySelectorAll("span")[3]?.textContent?.replace("@", "") ?? null,
            content: contentEl?.textContent ?? "",
            url: linkEl?.getAttribute("href") ?? "",
            mentionedAt: timeEl?.getAttribute("datetime") ?? new Date().toISOString(),
          }
        })
      )

      for (const tweet of tweets) {
        mentions.push({
          platform: "TWITTER",
          authorName: tweet.authorName,
          authorHandle: tweet.authorHandle,
          content: tweet.content,
          url: tweet.url ? `https://x.com${tweet.url}` : request.url,
          engagementCount: 0,
          mentionedAt: tweet.mentionedAt,
        })
      }
    },
    failedRequestHandler({ request }) {
      console.error(`Twitter scrape failed for: ${request.url}`)
    },
  })

  const urls = keywords.map(
    (kw) => `https://x.com/search?q=${encodeURIComponent(kw)}&f=live`
  )

  await crawler.run(urls)
  return mentions.slice(0, maxResults)
}

// ─── Instagram Scraper ───────────────────────────────────────

async function scrapeInstagram(
  keywords: string[],
  maxResults: number
): Promise<ScrapedMention[]> {
  const PlaywrightCrawler = await getCrawler()
  if (!PlaywrightCrawler) throw new Error("Scraping not available in serverless environment")

  const mentions: ScrapedMention[] = []

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: maxResults,
    headless: true,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ page, request }) {
      await page.waitForTimeout(3000)

      const posts = await page.$$eval("article a[href*='/p/']", (links) =>
        links.slice(0, 10).map((link) => ({
          url: link.getAttribute("href") ?? "",
          imgAlt: link.querySelector("img")?.getAttribute("alt") ?? "",
        }))
      )

      for (const post of posts) {
        mentions.push({
          platform: "INSTAGRAM",
          authorName: null,
          authorHandle: null,
          content: post.imgAlt,
          url: post.url ? `https://www.instagram.com${post.url}` : request.url,
          engagementCount: 0,
          mentionedAt: new Date().toISOString(),
        })
      }
    },
    failedRequestHandler({ request }) {
      console.error(`Instagram scrape failed for: ${request.url}`)
    },
  })

  const urls = keywords.map(
    (kw) => `https://www.instagram.com/explore/tags/${encodeURIComponent(kw.replace(/[^a-zA-Z0-9]/g, ""))}/`
  )

  await crawler.run(urls)
  return mentions.slice(0, maxResults)
}

// ─── TikTok Scraper ──────────────────────────────────────────

async function scrapeTikTok(
  keywords: string[],
  maxResults: number
): Promise<ScrapedMention[]> {
  const PlaywrightCrawler = await getCrawler()
  if (!PlaywrightCrawler) throw new Error("Scraping not available in serverless environment")

  const mentions: ScrapedMention[] = []

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: maxResults,
    headless: true,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ page, request }) {
      await page.waitForTimeout(3000)

      const videos = await page.$$eval("[data-e2e='search_top-item']", (items) =>
        items.slice(0, 10).map((item) => {
          const descEl = item.querySelector("[data-e2e='search-card-desc']")
          const authorEl = item.querySelector("[data-e2e='search-card-user-unique-id']")
          const linkEl = item.querySelector("a[href*='/@']")

          return {
            content: descEl?.textContent ?? "",
            authorHandle: authorEl?.textContent ?? null,
            url: linkEl?.getAttribute("href") ?? "",
          }
        })
      )

      for (const video of videos) {
        mentions.push({
          platform: "TIKTOK",
          authorName: null,
          authorHandle: video.authorHandle,
          content: video.content,
          url: video.url || request.url,
          engagementCount: 0,
          mentionedAt: new Date().toISOString(),
        })
      }
    },
    failedRequestHandler({ request }) {
      console.error(`TikTok scrape failed for: ${request.url}`)
    },
  })

  const urls = keywords.map(
    (kw) => `https://www.tiktok.com/search?q=${encodeURIComponent(kw)}`
  )

  await crawler.run(urls)
  return mentions.slice(0, maxResults)
}

// ─── YouTube Scraper ─────────────────────────────────────────

async function scrapeYouTube(
  keywords: string[],
  maxResults: number
): Promise<ScrapedMention[]> {
  const PlaywrightCrawler = await getCrawler()
  if (!PlaywrightCrawler) throw new Error("Scraping not available in serverless environment")

  const mentions: ScrapedMention[] = []

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: maxResults,
    headless: true,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ page }) {
      await page.waitForTimeout(2000)

      const videos = await page.$$eval("ytd-video-renderer", (renderers) =>
        renderers.slice(0, 10).map((renderer) => {
          const titleEl = renderer.querySelector("#video-title")
          const channelEl = renderer.querySelector("#channel-name a")
          const linkEl = renderer.querySelector("a#video-title")

          return {
            content: titleEl?.textContent?.trim() ?? "",
            authorName: channelEl?.textContent?.trim() ?? null,
            url: linkEl?.getAttribute("href") ?? "",
          }
        })
      )

      for (const video of videos) {
        mentions.push({
          platform: "YOUTUBE",
          authorName: video.authorName,
          authorHandle: null,
          content: video.content,
          url: video.url ? `https://www.youtube.com${video.url}` : "",
          engagementCount: 0,
          mentionedAt: new Date().toISOString(),
        })
      }
    },
    failedRequestHandler({ request }) {
      console.error(`YouTube scrape failed for: ${request.url}`)
    },
  })

  const urls = keywords.map(
    (kw) => `https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`
  )

  await crawler.run(urls)
  return mentions.slice(0, maxResults)
}

// ─── Main Scrape Function ────────────────────────────────────

const PLATFORM_SCRAPERS: Record<
  string,
  (keywords: string[], maxResults: number) => Promise<ScrapedMention[]>
> = {
  TWITTER: scrapeTwitter,
  INSTAGRAM: scrapeInstagram,
  TIKTOK: scrapeTikTok,
  YOUTUBE: scrapeYouTube,
}

export async function scrapeSocialMentions(
  options: ScrapeOptions
): Promise<ScrapedMention[]> {
  const { keywords, platforms, maxResults = 20 } = options

  const results = await Promise.allSettled(
    platforms.map((platform) => {
      const scraper = PLATFORM_SCRAPERS[platform]
      if (!scraper) return Promise.resolve([])
      return scraper(keywords, Math.ceil(maxResults / platforms.length))
    })
  )

  const allMentions: ScrapedMention[] = []
  for (const result of results) {
    if (result.status === "fulfilled") {
      allMentions.push(...result.value)
    }
  }

  return allMentions.slice(0, maxResults)
}
