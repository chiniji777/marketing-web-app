import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const now = new Date()

    // Find all content scheduled to be published
    const scheduledContent = await prisma.content.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      include: {
        posts: {
          include: {
            socialAccount: true,
          },
        },
      },
      take: 50, // Process 50 at a time
    })

    if (scheduledContent.length === 0) {
      return Response.json({ message: "No content to publish", published: 0 })
    }

    let published = 0
    let failed = 0

    for (const content of scheduledContent) {
      try {
        // TODO: Integrate with actual social media APIs
        // For now, just update status to PUBLISHED
        await prisma.content.update({
          where: { id: content.id },
          data: {
            status: "PUBLISHED",
            publishedAt: now,
          },
        })

        // Update associated posts if any
        if (content.posts.length > 0) {
          await prisma.contentPost.updateMany({
            where: { contentId: content.id },
            data: {
              status: "PUBLISHED",
              publishedAt: now,
            },
          })
        }

        published++
      } catch (error) {
        console.error(`Failed to publish content ${content.id}:`, error)
        failed++
      }
    }

    return Response.json({
      message: `Published ${published} content items`,
      published,
      failed,
      total: scheduledContent.length,
    })
  } catch (error) {
    console.error("Cron publish error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
