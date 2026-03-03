import { auth } from "@/lib/auth"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { z } from "zod"

const requestSchema = z.object({
  type: z.enum([
    "email_subject",
    "email_content",
    "campaign_description",
    "seo_keywords",
    "social_post",
    "ad_copy",
    "improve_text",
  ]),
  context: z.record(z.string(), z.unknown()).optional(),
  language: z.string().default("th"),
})

const PROMPTS: Record<string, (ctx: Record<string, unknown>, lang: string) => { system: string; user: string }> = {
  email_subject: (ctx, lang) => ({
    system: `You are an email marketing expert. Generate 5 compelling email subject lines. Output ONLY the subject lines, numbered 1-5, one per line. Language: ${lang === "th" ? "Thai" : "English"}.`,
    user: `Campaign: ${ctx.campaignName || "Marketing campaign"}
Topic: ${ctx.topic || "General promotion"}
Tone: ${ctx.tone || "professional"}
${ctx.productName ? `Product: ${ctx.productName}` : ""}`,
  }),

  email_content: (ctx, lang) => ({
    system: `You are an email marketing expert. Generate email HTML content that is professional, engaging, and optimized for conversions. Include a clear CTA. Language: ${lang === "th" ? "Thai" : "English"}. Output ONLY the HTML body content.`,
    user: `Subject: ${ctx.subject || ""}
Campaign: ${ctx.campaignName || ""}
Tone: ${ctx.tone || "professional"}
${ctx.productName ? `Product: ${ctx.productName}` : ""}
${ctx.additionalContext ? `Additional: ${ctx.additionalContext}` : ""}`,
  }),

  campaign_description: (ctx, lang) => ({
    system: `You are a marketing strategist. Generate a concise campaign description (2-3 sentences) based on the campaign details. Language: ${lang === "th" ? "Thai" : "English"}. Output ONLY the description text.`,
    user: `Campaign: ${ctx.campaignName || ""}
Type: ${ctx.campaignType || ""}
Channels: ${ctx.channels || ""}
${ctx.productName ? `Product: ${ctx.productName}` : ""}`,
  }),

  seo_keywords: (ctx, lang) => ({
    system: `You are an SEO specialist. Generate 15-20 relevant keywords/keyphrases for the given topic. Include a mix of short-tail and long-tail keywords. Output as a JSON array of strings. Language: ${lang === "th" ? "Thai" : "English"}.`,
    user: `Topic: ${ctx.topic || ctx.productName || ""}
Category: ${ctx.category || ""}
Target audience: ${ctx.audience || "general"}
${ctx.currentKeywords ? `Current keywords to expand on: ${ctx.currentKeywords}` : ""}`,
  }),

  social_post: (ctx, lang) => ({
    system: `You are a social media expert. Generate an engaging social media post. Include relevant emojis and hashtags. Language: ${lang === "th" ? "Thai" : "English"}. Output ONLY the post text.`,
    user: `Platform: ${ctx.platform || "general"}
Topic: ${ctx.topic || ""}
Tone: ${ctx.tone || "casual"}
${ctx.productName ? `Product: ${ctx.productName}` : ""}`,
  }),

  ad_copy: (ctx, lang) => ({
    system: `You are an advertising copywriter. Generate 3 variations of ad copy with headline, primary text, and CTA. Format each with clear labels. Language: ${lang === "th" ? "Thai" : "English"}.`,
    user: `Product: ${ctx.productName || ctx.topic || ""}
Platform: ${ctx.platform || "facebook"}
Objective: ${ctx.objective || "conversions"}
Target audience: ${ctx.audience || "general"}`,
  }),

  improve_text: (ctx, lang) => ({
    system: `You are a marketing copywriter. Improve the given text to be more engaging, persuasive, and professional while keeping the same meaning. Language: ${lang === "th" ? "Thai" : "English"}. Output ONLY the improved text.`,
    user: `Original text: ${ctx.text || ""}
Purpose: ${ctx.purpose || "marketing"}`,
  }),
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
    const fieldErrors = parsed.error.flatten().fieldErrors
    const errorMsg = Object.entries(fieldErrors)
      .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
      .join("; ") || "Invalid request data"
    return new Response(JSON.stringify({ error: errorMsg }), { status: 400 })
  }

  const { type, context, language } = parsed.data
  const promptBuilder = PROMPTS[type]
  if (!promptBuilder) {
    return new Response(JSON.stringify({ error: "Unknown assist type" }), { status: 400 })
  }

  const { system, user } = promptBuilder(context ?? {}, language)

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system,
      prompt: user,
      maxOutputTokens: 2000,
      temperature: 0.7,
    })

    return new Response(JSON.stringify({ result: result.text }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("AI assist error:", err)
    return new Response(
      JSON.stringify({ error: "AI generation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
