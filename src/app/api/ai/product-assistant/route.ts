import { auth } from "@/lib/auth"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { z } from "zod"

const requestSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productDescription: z.string().optional(),
  productCategory: z.string().optional(),
  productPrice: z.number().optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  currentData: z.record(z.string(), z.unknown()).optional(),
})

const SYSTEM_PROMPT = `คุณเป็น AI Marketing Strategist ที่เชี่ยวชาญในการวิเคราะห์สินค้าและวางกลยุทธ์การตลาด

เป้าหมายของคุณ: ถามคำถามเพื่อรวบรวมข้อมูลสำคัญที่จำเป็นสำหรับการทำโฆษณาและการตลาดอย่างมีประสิทธิภาพ

## ข้อมูลที่ต้องเก็บ (เรียงตามความสำคัญ):

1. **กลุ่มเป้าหมาย (Target Audience)**
   - อายุ, เพศ, อาชีพ, รายได้
   - ไลฟ์สไตล์, ความสนใจ
   - พฤติกรรมการซื้อ
   - ปัญหาหรือ pain points ที่สินค้าแก้ได้

2. **จุดขาย (USP - Unique Selling Points)**
   - สินค้าต่างจากคู่แข่งอย่างไร
   - ทำไมลูกค้าต้องเลือกสินค้านี้
   - คุณค่าหลักที่ลูกค้าจะได้รับ

3. **คู่แข่ง (Competitors)**
   - ใครคือคู่แข่งหลัก
   - จุดแข็ง/จุดอ่อนของคู่แข่ง
   - ราคาเปรียบเทียบ

4. **ตำแหน่งทางการตลาด (Market Position)**
   - ระดับราคา: พรีเมียม, กลาง, ราคาถูก
   - Brand personality/voice

5. **Emotional Triggers**
   - อารมณ์อะไรที่กระตุ้นการซื้อ
   - ความกลัวอะไรที่ลูกค้ามี (FOMO, fear of missing out)

6. **Customer Objections**
   - ข้อโต้แย้งที่ลูกค้ามักมี
   - วิธีตอบข้อโต้แย้ง

7. **Keywords & SEO**
   - คำค้นหาที่ลูกค้าใช้
   - hashtags ที่เกี่ยวข้อง

8. **Seasonality**
   - สินค้าขายได้ตลอดปีหรือเฉพาะบางช่วง
   - โอกาสพิเศษที่เหมาะกับการทำโปรโมชั่น

## วิธีการถาม:
- ถามทีละ 1-2 คำถามเท่านั้น อย่าถามรวดเดียวหลายข้อ
- ใช้ภาษาที่เข้าใจง่าย เป็นกันเอง
- ให้ตัวอย่างหรือตัวเลือกเพื่อช่วยให้ตอบง่ายขึ้น
- สรุปข้อมูลที่ได้หลังจากแต่ละคำตอบ
- เมื่อได้ข้อมูลครบถ้วนพอสมควร ให้สรุปทั้งหมดในรูปแบบ JSON

## การสรุปข้อมูล:
เมื่อได้ข้อมูลเพียงพอแล้ว (อย่างน้อย 5/8 หัวข้อ) ให้ตอบด้วย:
1. สรุปข้อมูลทั้งหมดที่ได้เป็นภาษาไทย
2. ให้คะแนนความสมบูรณ์ (0-100)
3. ปิดท้ายด้วย JSON block ในรูปแบบ:

\`\`\`marketing_data
{
  "targetAudience": { "demographics": "...", "interests": [...], "behaviors": [...], "locations": [...] },
  "uniqueSellingPoints": ["...", "..."],
  "painPoints": ["...", "..."],
  "competitors": [{ "name": "...", "strengths": "...", "weaknesses": "..." }],
  "marketPosition": "premium|mid-range|budget",
  "brandVoice": "...",
  "keyBenefits": ["...", "..."],
  "keywords": ["...", "..."],
  "emotionalTriggers": ["...", "..."],
  "customerObjections": [{ "objection": "...", "response": "..." }],
  "seasonality": "always|seasonal|event-based",
  "idealCustomerProfile": { "description": "..." },
  "marketingDataScore": 75
}
\`\`\`

ตอบเป็นภาษาไทยเสมอ ยกเว้น JSON keys`

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
    })
  }

  const { productName, productDescription, productCategory, productPrice, conversationHistory } =
    parsed.data

  // Build context about the product
  const productContext = [
    `ชื่อสินค้า: ${productName}`,
    productDescription && `รายละเอียด: ${productDescription}`,
    productCategory && `หมวดหมู่: ${productCategory}`,
    productPrice && `ราคา: ${productPrice} บาท`,
  ]
    .filter(Boolean)
    .join("\n")

  // Build messages array
  const messages = [
    {
      role: "user" as const,
      content: `ข้อมูลสินค้าเบื้องต้น:\n${productContext}\n\nเริ่มถามคำถามเพื่อรวบรวมข้อมูลการตลาดได้เลย`,
    },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
  ]

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  return result.toTextStreamResponse()
}
