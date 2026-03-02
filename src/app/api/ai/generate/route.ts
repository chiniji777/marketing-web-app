import { auth } from "@/lib/auth"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { generateContentSchema } from "@/server/validators/content"

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

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
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
  } = parsed.data

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

  return result.toTextStreamResponse()
}
