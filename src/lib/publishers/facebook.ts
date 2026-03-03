import { getPages } from "@/lib/facebook"
import type { PublishResult, PublishInput } from "./index"

const FB_API_VERSION = "v24.0"
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`

/**
 * Publish content to a Facebook Page.
 * Uses the user's access token to get page tokens, then posts to the page feed.
 */
export async function publishToFacebook(input: PublishInput): Promise<PublishResult> {
  const { content, socialAccount } = input
  const userAccessToken = socialAccount.accessToken

  // Get pages the user manages — each page has its own access token
  const pages = await getPages(userAccessToken)
  if (pages.length === 0) {
    return { success: false, error: "No Facebook Pages found. Connect a Page to publish." }
  }

  // Use metadata.pageId if stored, otherwise use the first page
  const metadata = socialAccount.metadata as Record<string, unknown> | null
  const targetPageId = metadata?.pageId as string | undefined
  const page = targetPageId
    ? pages.find((p) => p.id === targetPageId) || pages[0]
    : pages[0]

  const message = content.body || content.title
  const imageUrl = content.featuredImage

  try {
    let result: { id: string }

    if (imageUrl) {
      // Post with image — use /photos endpoint
      const res = await fetch(`${FB_GRAPH_URL}/${page.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          message,
          access_token: page.accessToken,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        return { success: false, error: `Facebook API: ${err.error?.message || res.statusText}` }
      }
      result = await res.json()
    } else {
      // Text-only post
      const res = await fetch(`${FB_GRAPH_URL}/${page.id}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: page.accessToken,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        return { success: false, error: `Facebook API: ${err.error?.message || res.statusText}` }
      }
      result = await res.json()
    }

    return { success: true, platformPostId: result.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Facebook publish failed" }
  }
}
