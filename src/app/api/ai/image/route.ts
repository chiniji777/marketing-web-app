import { auth } from "@/lib/auth"
import OpenAI from "openai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const requestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  style: z.enum(["vivid", "natural"]).default("vivid"),
  quality: z.enum(["standard", "hd"]).default("standard"),
  productId: z.string().optional(),
})

async function enrichPromptWithProduct(prompt: string, productId: string): Promise<string> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        description: true,
        category: true,
        brandVoice: true,
        targetAudience: true,
        uniqueSellingPoints: true,
        keyBenefits: true,
      },
    })

    if (!product) return prompt

    const context: string[] = []
    context.push(`Product: ${product.name}`)
    if (product.description) context.push(`Description: ${product.description}`)
    if (product.category) context.push(`Category: ${product.category}`)
    if (product.brandVoice) context.push(`Brand Voice: ${product.brandVoice}`)

    const usp = product.uniqueSellingPoints as string[] | null
    if (usp?.length) context.push(`Key selling points: ${usp.join(", ")}`)

    const benefits = product.keyBenefits as string[] | null
    if (benefits?.length) context.push(`Benefits: ${benefits.join(", ")}`)

    const audience = product.targetAudience as Record<string, unknown> | null
    if (audience) {
      const ageRange = audience.ageRange || audience.age
      const gender = audience.gender
      if (ageRange) context.push(`Target age: ${ageRange}`)
      if (gender) context.push(`Target gender: ${gender}`)
    }

    return `${prompt}\n\nBusiness context for the image: ${context.join(". ")}`
  } catch {
    return prompt
  }
}

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

  const { prompt, size, style, quality, productId } = parsed.data

  // Enrich prompt with product context if available
  const enrichedPrompt = productId
    ? await enrichPromptWithProduct(prompt, productId)
    : prompt

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enrichedPrompt,
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
