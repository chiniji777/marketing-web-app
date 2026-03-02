import { auth } from "@/lib/auth"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const sentimentSchema = z.object({
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE", "MIXED"]),
  score: z.number().min(-1).max(1),
  keywords: z.array(z.string()),
  summary: z.string(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { text } = await req.json()
  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "Text is required" }), { status: 400 })
  }

  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: sentimentSchema,
    prompt: `Analyze the sentiment of this social media mention about a brand:\n\n"${text}"\n\nReturn the sentiment classification, a score from -1 (very negative) to 1 (very positive), key keywords, and a brief summary.`,
  })

  return Response.json(result.object)
}
