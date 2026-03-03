import { auth } from "@/lib/auth"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { generateContentSchema } from "@/server/validators/content"
import { prisma } from "@/lib/prisma"

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  SOCIAL_POST:
    "You are a social media marketing expert. Create an engaging social media post that drives engagement.",
  BLOG_POST:
    "You are a content marketing expert. Write a compelling blog post with proper structure (headings, paragraphs, conclusion).",
  AD_COPY:
    "You are an advertising copywriter. Create persuasive ad copy that drives conversions with a clear call-to-action.",
  EMAIL:
    "You are an email marketing specialist. Write a compelling marketing email with subject line, preview text, and body.",
  LANDING_PAGE:
    "You are a landing page copywriter. Create persuasive landing page copy with headline, subheadline, benefits, and CTA.",
  VIDEO_SCRIPT:
    "You are a video content creator. Write an engaging video script with hook, main content, and call-to-action.",
}

const PLATFORM_GUIDELINES: Record<string, string> = {
  instagram:
    "Optimize for Instagram: use emojis, hashtags (5-10 relevant ones), keep it visual and engaging. Max 2200 characters.",
  facebook:
    "Optimize for Facebook: conversational tone, encourage comments, can be longer form. Include a question to boost engagement.",
  twitter:
    "Optimize for Twitter/X: concise and punchy, under 280 characters. Use 1-2 relevant hashtags.",
  linkedin:
    "Optimize for LinkedIn: professional tone, thought leadership angle, use line breaks for readability. Include relevant hashtags.",
  tiktok:
    "Optimize for TikTok: trendy, casual, use trending sounds references. Hook viewers in first 3 seconds.",
  general: "Create versatile content that can be adapted for multiple platforms.",
}

async function getProductContext(productId: string): Promise<string> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        description: true,
        category: true,
        price: true,
        currency: true,
        targetAudience: true,
        uniqueSellingPoints: true,
        painPoints: true,
        keyBenefits: true,
        keywords: true,
        emotionalTriggers: true,
        brandVoice: true,
        marketPosition: true,
        seasonality: true,
        competitors: true,
        idealCustomerProfile: true,
      },
    })

    if (!product) return ""

    const lines: string[] = [
      "\n--- ข้อมูลธุรกิจ/สินค้า ---",
      `ชื่อสินค้า: ${product.name}`,
    ]

    if (product.description) lines.push(`รายละเอียด: ${product.description}`)
    if (product.category) lines.push(`หมวดหมู่: ${product.category}`)
    if (product.price != null) lines.push(`ราคา: ${product.currency}${product.price.toLocaleString()}`)
    if (product.brandVoice) lines.push(`Brand Voice: ${product.brandVoice}`)
    if (product.marketPosition) lines.push(`ตำแหน่งตลาด: ${product.marketPosition}`)
    if (product.seasonality) lines.push(`ฤดูกาล/ช่วงเวลา: ${product.seasonality}`)

    const usp = product.uniqueSellingPoints as string[] | null
    if (usp?.length) lines.push(`จุดขายเด่น (USP): ${usp.join(", ")}`)

    const benefits = product.keyBenefits as string[] | null
    if (benefits?.length) lines.push(`ประโยชน์หลัก: ${benefits.join(", ")}`)

    const painPoints = product.painPoints as string[] | null
    if (painPoints?.length) lines.push(`ปัญหาที่ลูกค้ามี: ${painPoints.join(", ")}`)

    const triggers = product.emotionalTriggers as string[] | null
    if (triggers?.length) lines.push(`อารมณ์กระตุ้น: ${triggers.join(", ")}`)

    const kw = product.keywords as string[] | null
    if (kw?.length) lines.push(`Keywords: ${kw.join(", ")}`)

    const audience = product.targetAudience as Record<string, unknown> | null
    if (audience && Object.keys(audience).length > 0) {
      lines.push(`กลุ่มเป้าหมาย: ${JSON.stringify(audience)}`)
    }

    const icp = product.idealCustomerProfile as Record<string, unknown> | null
    if (icp && Object.keys(icp).length > 0) {
      lines.push(`ลูกค้าในอุดมคติ: ${JSON.stringify(icp)}`)
    }

    const competitors = product.competitors as Array<Record<string, unknown>> | null
    if (competitors?.length) {
      const names = competitors.map((c) => c.name || "ไม่ระบุ").join(", ")
      lines.push(`คู่แข่ง: ${names}`)
    }

    lines.push("--- จบข้อมูลธุรกิจ ---")
    lines.push("ใช้ข้อมูลธุรกิจ/สินค้าด้านบนเป็น context ในการสร้างเนื้อหาให้ตรงกลุ่มเป้าหมายและสอดคล้องกับ brand voice")

    return lines.join("\n")
  } catch {
    return ""
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
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const errorMsg = Object.entries(fieldErrors)
      .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
      .join("; ") || "Invalid request data"
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 400,
    })
  }

  const {
    contentType,
    topic,
    tone,
    language,
    platform,
    keywords,
    additionalInstructions,
    productId,
  } = parsed.data

  // Fetch product context if productId provided
  const productContext = productId ? await getProductContext(productId) : ""

  const systemPrompt = CONTENT_TYPE_PROMPTS[contentType] ?? CONTENT_TYPE_PROMPTS.SOCIAL_POST
  const platformGuide = platform
    ? PLATFORM_GUIDELINES[platform] ?? ""
    : ""

  const userPrompt = [
    `Create ${contentType.replace("_", " ").toLowerCase()} about: ${topic}`,
    `Tone: ${tone}`,
    `Language: ${language === "en" ? "English" : language === "th" ? "Thai" : language}`,
    platformGuide && `Platform guidelines: ${platformGuide}`,
    keywords && `Include these keywords naturally: ${keywords}`,
    additionalInstructions && `Additional instructions: ${additionalInstructions}`,
    productContext,
    "",
    "Output the content directly without any meta-commentary. Do not include labels like 'Subject:' unless it's an email format.",
  ]
    .filter(Boolean)
    .join("\n")

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 2000,
    temperature: 0.8,
  })

  return result.toUIMessageStreamResponse()
}
