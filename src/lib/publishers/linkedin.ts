import type { PublishResult, PublishInput } from "./index"

const LINKEDIN_API_URL = "https://api.linkedin.com/v2"

/**
 * Publish content to LinkedIn via API v2.
 * Requires OAuth 2.0 Bearer token with w_member_social scope.
 * Supports text posts and image shares.
 */
export async function publishToLinkedin(input: PublishInput): Promise<PublishResult> {
  const { content, socialAccount } = input
  const accessToken = socialAccount.accessToken

  // Get LinkedIn member URN from metadata or profile API
  const metadata = socialAccount.metadata as Record<string, unknown> | null
  let personUrn = metadata?.personUrn as string | undefined

  if (!personUrn) {
    try {
      const profileRes = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!profileRes.ok) {
        return { success: false, error: "Failed to get LinkedIn profile. Reconnect your account." }
      }
      const profile = await profileRes.json()
      personUrn = `urn:li:person:${profile.sub}`
    } catch {
      return { success: false, error: "Failed to get LinkedIn profile." }
    }
  }

  const text = content.body || content.title

  try {
    let imageAsset: string | undefined

    // Upload image if available
    if (content.featuredImage) {
      imageAsset = await uploadImage(content.featuredImage, personUrn, accessToken)
    }

    // Build UGC post payload
    const shareContent: Record<string, unknown> = {
      shareCommentary: { text },
      shareMediaCategory: imageAsset ? "IMAGE" : "NONE",
    }

    if (imageAsset) {
      shareContent.media = [
        {
          status: "READY",
          originalUrl: content.featuredImage,
          media: imageAsset,
          title: { text: content.title },
        },
      ]
    }

    const postBody = {
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": shareContent,
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    const res = await fetch(`${LINKEDIN_API_URL}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: `LinkedIn API: ${err.message || res.statusText}` }
    }

    const postId = res.headers.get("x-restli-id") || "unknown"
    return { success: true, platformPostId: postId }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "LinkedIn publish failed" }
  }
}

async function uploadImage(
  imageUrl: string,
  personUrn: string,
  accessToken: string
): Promise<string | undefined> {
  try {
    // Step 1: Register upload
    const registerRes = await fetch(`${LINKEDIN_API_URL}/assets?action=registerUpload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: personUrn,
          serviceRelationships: [
            { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
          ],
        },
      }),
    })

    if (!registerRes.ok) return undefined
    const registerData = await registerRes.json()
    const uploadUrl =
      registerData.value?.uploadMechanism?.[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ]?.uploadUrl
    const asset = registerData.value?.asset

    if (!uploadUrl || !asset) return undefined

    // Step 2: Upload image binary
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return undefined
    const imgBuffer = await imgRes.arrayBuffer()

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/jpeg",
      },
      body: imgBuffer,
    })

    if (!uploadRes.ok) return undefined
    return asset
  } catch {
    return undefined
  }
}
