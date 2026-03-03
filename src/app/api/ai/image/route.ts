import { auth } from "@/lib/auth"
import OpenAI from "openai"
import { z } from "zod"

const requestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  style: z.enum(["vivid", "natural"]).default("vivid"),
  quality: z.enum(["standard", "hd"]).default("standard"),
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const { prompt, size, style, quality } = parsed.data

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      style,
      quality,
    })

    const imageUrl = response.data?.[0]?.url
    const revisedPrompt = response.data?.[0]?.revised_prompt

    return new Response(
      JSON.stringify({ imageUrl, revisedPrompt }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("DALL-E error:", err)
    const message = err instanceof Error ? err.message : "Image generation failed"
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
