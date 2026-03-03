import type { PublishResult, PublishInput } from "./index"

const FB_API_VERSION = "v24.0"
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`

/**
 * Publish content to Instagram via Facebook Graph API.
 * Requires: instagram_content_publish, instagram_basic scopes on the Facebook token.
 * Instagram REQUIRES an image — text-only posts are not supported.
 */
export async function publishToInstagram(input: PublishInput): Promise<PublishResult> {
  const { content, socialAccount } = input
  const accessToken = socialAccount.accessToken

  // Instagram requires an image
  if (!content.featuredImage) {
    return { success: false, error: "Instagram requires an image. Add a featured image to publish." }
  }

  // Get Instagram Business Account ID from metadata or via API
  const metadata = socialAccount.metadata as Record<string, unknown> | null
  let igUserId = metadata?.instagramBusinessAccountId as string | undefined

  if (!igUserId) {
    // Try to find IG account from Facebook Pages
    try {
      const pagesRes = await fetch(
        `${FB_GRAPH_URL}/me/accounts?fields=id,instagram_business_account&access_token=${accessToken}`
      )
      if (!pagesRes.ok) {
        return { success: false, error: "Failed to get Instagram account. Reconnect Facebook with Instagram permissions." }
      }
      const pagesData = await pagesRes.json()
      const pageWithIg = pagesData.data?.find(
        (p: Record<string, unknown>) => p.instagram_business_account
      )
      if (!pageWithIg?.instagram_business_account) {
        return { success: false, error: "No Instagram Business Account linked to your Facebook Pages." }
      }
      igUserId = (pageWithIg.instagram_business_account as Record<string, string>).id
    } catch {
      return { success: false, error: "Failed to find Instagram Business Account." }
    }
  }

  const caption = content.body || content.title

  try {
    // Step 1: Create media container
    const createRes = await fetch(`${FB_GRAPH_URL}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: content.featuredImage,
        caption,
        access_token: accessToken,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      return { success: false, error: `Instagram API: ${err.error?.message || createRes.statusText}` }
    }

    const { id: containerId } = await createRes.json()

    // Step 2: Wait briefly for processing, then publish
    await new Promise((r) => setTimeout(r, 3000))

    const publishRes = await fetch(`${FB_GRAPH_URL}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    })

    if (!publishRes.ok) {
      const err = await publishRes.json()
      return { success: false, error: `Instagram publish: ${err.error?.message || publishRes.statusText}` }
    }

    const result = await publishRes.json()
    return { success: true, platformPostId: result.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Instagram publish failed" }
  }
}
