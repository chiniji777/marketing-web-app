import type { PublishResult, PublishInput } from "./index"

/**
 * TikTok Content Posting API.
 * TikTok requires VIDEO content — image/text posts are not supported via API.
 * This is a stub that returns a clear error message.
 *
 * When video support is added, use:
 * - POST https://open.tiktokapis.com/v2/post/publish/content/init/
 * - Requires video_publish scope
 */
export async function publishToTiktok(_input: PublishInput): Promise<PublishResult> {
  return {
    success: false,
    error: "TikTok requires video content for API publishing. Text/image posts are not supported via the TikTok API. Please post manually or add video content support.",
  }
}
