import { prisma } from "@/lib/prisma"
import { publishToPlatform } from "@/lib/publishers"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Allow up to 60s for publishing multiple posts

const MAX_RETRIES = 3

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const now = new Date()

    // Find all content scheduled to be published (with their social posts)
    const scheduledContent = await prisma.content.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      include: {
        posts: {
          where: {
            status: { in: ["SCHEDULED", "PENDING"] },
          },
          include: {
            socialAccount: true,
          },
        },
      },
      take: 50,
    })

    if (scheduledContent.length === 0) {
      return Response.json({ message: "No content to publish", published: 0 })
    }

    let publishedCount = 0
    let failedCount = 0
    const results: Array<{ contentId: string; title: string; posts: Array<{ platform: string; success: boolean; error?: string }> }> = []

    for (const content of scheduledContent) {
      const contentResult: typeof results[0] = {
        contentId: content.id,
        title: content.title,
        posts: [],
      }

      if (content.posts.length === 0) {
        // No social accounts linked — just mark as published
        await prisma.content.update({
          where: { id: content.id },
          data: { status: "PUBLISHED", publishedAt: now },
        })
        publishedCount++
        results.push(contentResult)
        continue
      }

      let allSuccess = true
      let anySuccess = false

      for (const post of content.posts) {
        // Skip posts that have failed too many times
        const metadata = (post.metrics as Record<string, unknown>) || {}
        const retryCount = (metadata.retryCount as number) || 0
        if (retryCount >= MAX_RETRIES) {
          contentResult.posts.push({
            platform: post.socialAccount.platform,
            success: false,
            error: `Max retries (${MAX_RETRIES}) exceeded`,
          })
          allSuccess = false
          continue
        }

        // Mark as PUBLISHING
        await prisma.contentPost.update({
          where: { id: post.id },
          data: { status: "PUBLISHING" },
        })

        // Publish to the platform
        const result = await publishToPlatform({
          content: {
            id: content.id,
            title: content.title,
            body: content.body,
            contentType: content.contentType,
            featuredImage: content.featuredImage,
          },
          socialAccount: {
            id: post.socialAccount.id,
            platform: post.socialAccount.platform,
            accessToken: post.socialAccount.accessToken,
            metadata: post.socialAccount.metadata,
          },
        })

        if (result.success) {
          await prisma.contentPost.update({
            where: { id: post.id },
            data: {
              status: "PUBLISHED",
              publishedAt: now,
              platformPostId: result.platformPostId || null,
            },
          })
          anySuccess = true
          contentResult.posts.push({
            platform: post.socialAccount.platform,
            success: true,
          })
        } else {
          await prisma.contentPost.update({
            where: { id: post.id },
            data: {
              status: "FAILED",
              errorMessage: result.error || "Unknown error",
              metrics: { ...metadata, retryCount: retryCount + 1 },
            },
          })
          allSuccess = false
          failedCount++
          contentResult.posts.push({
            platform: post.socialAccount.platform,
            success: false,
            error: result.error,
          })
          console.error(
            `Failed to publish content ${content.id} to ${post.socialAccount.platform}:`,
            result.error
          )
        }
      }

      // Update content status based on results
      if (allSuccess || anySuccess) {
        await prisma.content.update({
          where: { id: content.id },
          data: { status: "PUBLISHED", publishedAt: now },
        })
        publishedCount++
      }
      // If all failed and retries remain, leave as SCHEDULED for next cron run

      results.push(contentResult)
    }

    return Response.json({
      message: `Processed ${scheduledContent.length} content items`,
      published: publishedCount,
      failed: failedCount,
      total: scheduledContent.length,
      results,
    })
  } catch (error) {
    console.error("Cron publish error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
