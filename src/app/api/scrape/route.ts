import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { scrapeSocialMentions, type ScrapedMention } from "@/lib/scraper"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json() as {
    keywords?: string[]
    platforms?: string[]
    maxResults?: number
  }

  if (!body.keywords?.length) {
    return NextResponse.json(
      { error: "At least one keyword is required" },
      { status: 400 }
    )
  }

  const validPlatforms = ["TWITTER", "INSTAGRAM", "TIKTOK", "YOUTUBE"]
  const platforms = (body.platforms ?? validPlatforms).filter((p) =>
    validPlatforms.includes(p)
  )

  if (platforms.length === 0) {
    return NextResponse.json(
      { error: "At least one valid platform is required" },
      { status: 400 }
    )
  }

  try {
    const scraped = await scrapeSocialMentions({
      keywords: body.keywords,
      platforms,
      maxResults: body.maxResults ?? 20,
    })

    const db = getTenantPrisma(session.user.activeOrganizationId)
    const organizationId = session.user.activeOrganizationId

    // Store scraped mentions in the database
    const stored = await Promise.all(
      scraped.map((mention: ScrapedMention) =>
        db.socialMention.create({
          data: {
            organizationId,
            platform: mention.platform as "TWITTER" | "INSTAGRAM" | "TIKTOK" | "YOUTUBE",
            authorName: mention.authorName,
            authorHandle: mention.authorHandle,
            content: mention.content,
            url: mention.url || undefined,
            engagementCount: mention.engagementCount,
            mentionedAt: new Date(mention.mentionedAt),
            matchedKeyword: body.keywords!.join(", "),
          },
        })
      )
    )

    // Trigger AI sentiment analysis for each mention
    const sentimentPromises = stored.map(async (m) => {
      try {
        const sentimentRes = await fetch(
          new URL("/api/ai/sentiment", request.url).toString(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: m.content, mentionId: m.id }),
          }
        )
        if (sentimentRes.ok) {
          const sentimentData = await sentimentRes.json() as {
            sentiment: string
            score: number
          }
          await db.socialMention.update({
            where: { id: m.id },
            data: {
              sentiment: sentimentData.sentiment as "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
              sentimentScore: sentimentData.score,
            },
          })
        }
      } catch {
        // Sentiment analysis failure is non-critical
      }
    })

    await Promise.allSettled(sentimentPromises)

    return NextResponse.json({
      success: true,
      scraped: scraped.length,
      stored: stored.length,
      message: `Scraped ${scraped.length} mentions from ${platforms.join(", ")}`,
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return NextResponse.json(
      { error: "Scraping failed. Some platforms may require authentication." },
      { status: 500 }
    )
  }
}
