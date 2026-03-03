import type { PublishResult, PublishInput } from "./index"

const PINTEREST_API_URL = "https://api.pinterest.com/v5"

/**
 * Publish content to Pinterest via API v5.
 * Requires OAuth 2.0 Bearer token with pins:write scope.
 * Pinterest REQUIRES an image — text-only pins are not supported.
 */
export async function publishToPinterest(input: PublishInput): Promise<PublishResult> {
  const { content, socialAccount } = input
  const accessToken = socialAccount.accessToken

  if (!content.featuredImage) {
    return { success: false, error: "Pinterest requires an image. Add a featured image to publish." }
  }

  // Get board ID from metadata — Pinterest requires a board
  const metadata = socialAccount.metadata as Record<string, unknown> | null
  const boardId = metadata?.defaultBoardId as string | undefined

  if (!boardId) {
    return {
      success: false,
      error: "No Pinterest board configured. Set a default board in your social account settings.",
    }
  }

  const description = content.body || content.title
  // Pinterest description limit is 500 chars
  const truncated = description.length > 500 ? description.slice(0, 497) + "..." : description

  try {
    const res = await fetch(`${PINTEREST_API_URL}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: boardId,
        title: content.title.slice(0, 100), // Pinterest title limit
        description: truncated,
        media_source: {
          source_type: "image_url",
          url: content.featuredImage,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: `Pinterest API: ${err.message || res.statusText}` }
    }

    const result = await res.json()
    return { success: true, platformPostId: result.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Pinterest publish failed" }
  }
}
