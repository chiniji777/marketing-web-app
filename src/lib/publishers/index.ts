import type { SocialPlatform } from "@/generated/prisma/client"
import { publishToFacebook } from "./facebook"
import { publishToInstagram } from "./instagram"
import { publishToTwitter } from "./twitter"
import { publishToLinkedin } from "./linkedin"
import { publishToTiktok } from "./tiktok"
import { publishToYoutube } from "./youtube"
import { publishToPinterest } from "./pinterest"

export interface PublishInput {
  content: {
    id: string
    title: string
    body: string
    contentType: string
    featuredImage: string | null
  }
  socialAccount: {
    id: string
    platform: SocialPlatform
    accessToken: string
    metadata: unknown
  }
}

export interface PublishResult {
  success: boolean
  platformPostId?: string
  error?: string
}

const publishers: Record<SocialPlatform, (input: PublishInput) => Promise<PublishResult>> = {
  FACEBOOK: publishToFacebook,
  INSTAGRAM: publishToInstagram,
  TWITTER: publishToTwitter,
  LINKEDIN: publishToLinkedin,
  TIKTOK: publishToTiktok,
  YOUTUBE: publishToYoutube,
  PINTEREST: publishToPinterest,
}

/**
 * Dispatch content publishing to the appropriate platform.
 */
export async function publishToPlatform(input: PublishInput): Promise<PublishResult> {
  const publisher = publishers[input.socialAccount.platform]
  if (!publisher) {
    return { success: false, error: `Unsupported platform: ${input.socialAccount.platform}` }
  }

  try {
    return await publisher(input)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Publishing failed unexpectedly",
    }
  }
}
