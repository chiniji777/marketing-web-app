import type { PublishResult, PublishInput } from "./index"

/**
 * YouTube Data API v3.
 * YouTube only supports VIDEO uploads — image/text posts are not supported.
 * Community posts are only available to channels with 500+ subscribers and no API.
 * This is a stub that returns a clear error message.
 */
export async function publishToYoutube(_input: PublishInput): Promise<PublishResult> {
  return {
    success: false,
    error: "YouTube requires video content for API publishing. Text/image posts are not supported. Please upload videos manually or add video content support.",
  }
}
