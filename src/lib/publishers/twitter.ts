import type { PublishResult, PublishInput } from "./index"

const TWITTER_API_URL = "https://api.twitter.com/2"

/**
 * Publish content to Twitter/X via API v2.
 * Requires OAuth 2.0 Bearer token stored in SocialAccount.accessToken.
 * Supports text tweets and image uploads.
 */
export async function publishToTwitter(input: PublishInput): Promise<PublishResult> {
  const { content, socialAccount } = input
  const accessToken = socialAccount.accessToken

  // Twitter has a 280 character limit — truncate if needed
  const fullText = content.body || content.title
  const text = fullText.length > 280 ? fullText.slice(0, 277) + "..." : fullText

  try {
    let mediaId: string | undefined

    // Upload image if available
    if (content.featuredImage) {
      mediaId = await uploadMedia(content.featuredImage, accessToken)
    }

    // Create tweet
    const tweetBody: Record<string, unknown> = { text }
    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] }
    }

    const res = await fetch(`${TWITTER_API_URL}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetBody),
    })

    if (!res.ok) {
      const err = await res.json()
      const errorMsg = err.detail || err.errors?.[0]?.message || res.statusText
      return { success: false, error: `Twitter API: ${errorMsg}` }
    }

    const result = await res.json()
    return { success: true, platformPostId: result.data?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Twitter publish failed" }
  }
}

/**
 * Upload media to Twitter via v1.1 media upload endpoint.
 * Twitter v2 doesn't have a media upload — still uses v1.1.
 */
async function uploadMedia(imageUrl: string, accessToken: string): Promise<string | undefined> {
  try {
    // Download image first
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return undefined

    const imgBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuffer).toString("base64")

    const formData = new URLSearchParams()
    formData.set("media_data", base64)

    const uploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!uploadRes.ok) return undefined
    const uploadData = await uploadRes.json()
    return uploadData.media_id_string
  } catch {
    return undefined
  }
}
