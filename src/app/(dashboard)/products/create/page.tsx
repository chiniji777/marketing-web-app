"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Send, Package, ArrowRight, Loader2, CheckCircle2, Save } from "lucide-react"
import { toast } from "sonner"
import { createProduct, updateProductMarketingData } from "@/server/actions/product"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface MarketingData {
  targetAudience?: Record<string, unknown>
  uniqueSellingPoints?: string[]
  painPoints?: string[]
  competitors?: Array<Record<string, unknown>>
  marketPosition?: string
  brandVoice?: string
  keyBenefits?: string[]
  keywords?: string[]
  emotionalTriggers?: string[]
  customerObjections?: Array<Record<string, unknown>>
  seasonality?: string
  idealCustomerProfile?: Record<string, unknown>
  marketingDataScore?: number
}

export default function CreateProductPage() {
  const router = useRouter()
  const [step, setStep] = useState<"info" | "ai">("info")

  // Product info
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [productId, setProductId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // AI chat
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null)
  const [saving, setSaving] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Step 1: Create product with basic info
  const handleCreateProduct = async () => {
    if (!name.trim()) {
      toast.error("กรุณาใส่ชื่อสินค้า")
      return
    }

    setCreating(true)
    try {
      const product = await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
      })
      setProductId(product.id)
      setStep("ai")
      // Auto-start AI conversation
      sendToAI([])
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถสร้างสินค้าได้"
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  // Send message to AI
  const sendToAI = async (history: Message[]) => {
    setStreaming(true)
    try {
      const res = await fetch("/api/ai/product-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId || "pending",
          productName: name,
          productDescription: description,
          productCategory: category,
          productPrice: price ? parseFloat(price) : undefined,
          conversationHistory: history,
        }),
      })

      if (!res.ok) throw new Error("AI request failed")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response stream")

      let assistantMessage = ""
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        assistantMessage += chunk
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: assistantMessage }
          return updated
        })
      }

      // Check if AI returned marketing data JSON
      const jsonMatch = assistantMessage.match(/```marketing_data\n([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]) as MarketingData
          setMarketingData(data)
        } catch {
          toast.error("ไม่สามารถอ่านข้อมูลจาก AI ได้ ลองถามใหม่อีกครั้ง")
          // Calculate a basic score from what fields exist in the conversation
          const basicData: MarketingData = { marketingDataScore: 0 }
          setMarketingData(basicData)
        }
      }
    } catch {
      toast.error("AI ไม่สามารถตอบได้ ลองอีกครั้ง")
    } finally {
      setStreaming(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || streaming) return

    const userMessage: Message = { role: "user", content: input.trim() }
    const updatedHistory = [...messages, userMessage]
    setMessages(updatedHistory)
    setInput("")

    await sendToAI(updatedHistory)
  }

  const handleSaveMarketingData = async () => {
    if (!productId || !marketingData) return
    setSaving(true)
    try {
      await updateProductMarketingData({
        id: productId,
        ...marketingData,
        aiConversation: messages.map((m) => ({ role: m.role, content: m.content })),
      })
      toast.success("บันทึกข้อมูลการตลาดเรียบร้อย!")
      router.push(`/products/${productId}`)
    } catch {
      toast.error("ไม่สามารถบันทึกได้")
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Step 1: Basic Product Info
  if (step === "info") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          heading="สร้างสินค้าใหม่"
          description="กรอกข้อมูลเบื้องต้น แล้ว AI จะช่วยถามคำถามเพื่อรวบรวมข้อมูลการตลาด"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              ข้อมูลสินค้าเบื้องต้น
            </CardTitle>
            <CardDescription>
              กรอกข้อมูลที่รู้ก่อน — AI จะถามเพิ่มเติมในขั้นตอนถัดไป
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">ชื่อสินค้า *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ครีมกันแดด SPF50+"
              />
            </div>
            <div>
              <Label htmlFor="description">รายละเอียดสินค้า</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายสินค้าคร่าวๆ..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">หมวดหมู่</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="เช่น ความงาม, อาหาร"
                />
              </div>
              <div>
                <Label htmlFor="price">ราคา (บาท)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button onClick={handleCreateProduct} className="w-full" size="lg" disabled={creating || !name.trim()}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังสร้างสินค้า...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  สร้างสินค้า & เริ่มวิเคราะห์ด้วย AI
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: AI Conversation
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        heading={`AI วิเคราะห์: ${name}`}
        description="ตอบคำถาม AI เพื่อรวบรวมข้อมูลสำคัญสำหรับการทำโฆษณา"
      >
        {marketingData && (
          <Button onClick={handleSaveMarketingData} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            บันทึกข้อมูลการตลาด
          </Button>
        )}
      </PageHeader>

      {/* Marketing Data Score */}
      {marketingData?.marketingDataScore != null && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">
                รวบรวมข้อมูลครบแล้ว!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                คะแนนความสมบูรณ์: {marketingData.marketingDataScore}/100 — กดบันทึกเพื่อใช้ข้อมูลนี้ทำโฆษณา
              </p>
            </div>
            <Badge variant="default" className="bg-green-600">
              {marketingData.marketingDataScore}%
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="flex flex-col" style={{ minHeight: "500px" }}>
        <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>AI กำลังเตรียมคำถาม...</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content
                    .replace(/```marketing_data[\s\S]*?```/g, "")
                    .trim()}
                </div>
              </div>
            </div>
          ))}

          {streaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์คำตอบ..."
              disabled={streaming}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || streaming}
              size="icon"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
