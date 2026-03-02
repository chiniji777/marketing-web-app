"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Target,
  Users,
  Sparkles,
  TrendingUp,
  Send,
  Loader2,
  Save,
  ArrowLeft,
  BarChart3,
  Shield,
  Heart,
  Search as SearchIcon,
  Clock,
  MessageCircle,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getProduct, updateProductMarketingData } from "@/server/actions/product"

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

interface ProductData {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  currency: string
  status: string
  marketingDataScore: number
  targetAudience: Record<string, unknown> | null
  uniqueSellingPoints: string[] | null
  painPoints: string[] | null
  competitors: Array<Record<string, unknown>> | null
  marketPosition: string | null
  brandVoice: string | null
  keyBenefits: string[] | null
  keywords: string[] | null
  emotionalTriggers: string[] | null
  customerObjections: Array<Record<string, unknown>> | null
  seasonality: string | null
  idealCustomerProfile: Record<string, unknown> | null
  aiConversation: Array<{ role: string; content: string }> | null
  adsCampaigns: Array<{ id: string; name: string; status: string; platform: string }>
}

export default function ProductDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const defaultTab = searchParams.get("tab") || "overview"

  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)

  // AI chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [newMarketingData, setNewMarketingData] = useState<MarketingData | null>(null)
  const [saving, setSaving] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const loadProduct = useCallback(async () => {
    try {
      const data = await getProduct(id)
      setProduct(data as unknown as ProductData)
      // Load existing conversation
      if (data.aiConversation) {
        setMessages(data.aiConversation as unknown as Message[])
      }
    } catch {
      toast.error("ไม่พบสินค้า")
      router.push("/products")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendToAI = async (history: Message[]) => {
    if (!product) return
    setStreaming(true)
    try {
      const res = await fetch("/api/ai/product-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productDescription: product.description,
          productCategory: product.category,
          productPrice: product.price,
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

      const jsonMatch = assistantMessage.match(/```marketing_data\n([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          setNewMarketingData(JSON.parse(jsonMatch[1]) as MarketingData)
        } catch {
          // ignore
        }
      }
    } catch {
      toast.error("AI ไม่สามารถตอบได้")
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

  const startAIConversation = () => {
    sendToAI(messages)
  }

  const handleSaveMarketingData = async () => {
    if (!product || !newMarketingData) return
    setSaving(true)
    try {
      await updateProductMarketingData({
        id: product.id,
        ...newMarketingData,
        aiConversation: messages.map((m) => ({ role: m.role, content: m.content })),
      })
      toast.success("บันทึกข้อมูลการตลาดเรียบร้อย!")
      loadProduct()
      setNewMarketingData(null)
    } catch {
      toast.error("ไม่สามารถบันทึกได้")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (!product) return null

  const renderArrayList = (items: string[] | null, emptyText: string) => {
    if (!items || items.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>
    return (
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm">• {item}</li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          heading={product.name}
          description={product.description || "ยังไม่มีรายละเอียด"}
        >
          <div className="flex gap-2">
            <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
              {product.status === "ACTIVE" ? "เปิดใช้งาน" : product.status === "DRAFT" ? "แบบร่าง" : "เก็บถาวร"}
            </Badge>
            <Badge variant="outline">
              <BarChart3 className="mr-1 h-3 w-3" />
              {product.marketingDataScore}%
            </Badge>
          </div>
        </PageHeader>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="marketing">ข้อมูลการตลาด</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-1 h-3 w-3" />
            AI วิเคราะห์
          </TabsTrigger>
          <TabsTrigger value="campaigns">แคมเปญ</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">หมวดหมู่</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{product.category || "-"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ราคา</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {product.price != null ? `฿${product.price.toLocaleString()}` : "-"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">แคมเปญโฆษณา</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{product.adsCampaigns.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick marketing data summary */}
          {product.marketingDataScore > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>สรุปข้อมูลการตลาด</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4" /> จุดขาย (USP)
                  </h4>
                  {renderArrayList(product.uniqueSellingPoints, "ยังไม่มีข้อมูล")}
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4" /> ประโยชน์หลัก
                  </h4>
                  {renderArrayList(product.keyBenefits, "ยังไม่มีข้อมูล")}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Marketing Data Tab */}
        <TabsContent value="marketing" className="space-y-4">
          {product.marketingDataScore === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">ยังไม่มีข้อมูลการตลาด</h3>
              <p className="mb-4 text-muted-foreground">ใช้ AI วิเคราะห์เพื่อรวบรวมข้อมูลสำคัญ</p>
              <Button onClick={() => {
                const tabTrigger = document.querySelector('[data-value="ai"]') as HTMLButtonElement
                tabTrigger?.click()
              }}>
                <Sparkles className="mr-2 h-4 w-4" />
                เริ่ม AI วิเคราะห์
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" /> กลุ่มเป้าหมาย
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.targetAudience ? (
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(product.targetAudience, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4" /> จุดขาย (USP)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderArrayList(product.uniqueSellingPoints, "ยังไม่มีข้อมูล")}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" /> Pain Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderArrayList(product.painPoints, "ยังไม่มีข้อมูล")}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" /> คู่แข่ง
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.competitors && product.competitors.length > 0 ? (
                    <ul className="space-y-2">
                      {product.competitors.map((c: Record<string, unknown>, i: number) => (
                        <li key={i} className="text-sm">
                          <strong>{String(c.name || "N/A")}</strong>
                          {c.strengths ? <span className="text-muted-foreground"> — {String(c.strengths)}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <SearchIcon className="h-4 w-4" /> Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.keywords && product.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {product.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline">{kw}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" /> ข้อมูลเพิ่มเติม
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>ตำแหน่ง:</strong> {product.marketPosition || "-"}</p>
                  <p><strong>Brand Voice:</strong> {product.brandVoice || "-"}</p>
                  <p><strong>Seasonality:</strong> {product.seasonality || "-"}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4">
          {newMarketingData && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    AI รวบรวมข้อมูลครบแล้ว! คะแนน: {newMarketingData.marketingDataScore}/100
                  </p>
                  <p className="text-sm text-green-600">กดบันทึกเพื่ออัปเดตข้อมูลการตลาด</p>
                </div>
                <Button onClick={handleSaveMarketingData} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  บันทึก
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="flex flex-col" style={{ minHeight: "500px" }}>
            <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                    <p className="mb-4 text-muted-foreground">เริ่มสนทนากับ AI เพื่อรวบรวมข้อมูลการตลาด</p>
                    <Button onClick={startAIConversation}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      เริ่มสนทนา
                    </Button>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content.replace(/```marketing_data[\s\S]*?```/g, "").trim()}
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

            {messages.length > 0 && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() }}}
                    placeholder="พิมพ์คำตอบ..."
                    disabled={streaming}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!input.trim() || streaming} size="icon">
                    {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {product.adsCampaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">ยังไม่มีแคมเปญ</h3>
              <p className="mb-4 text-muted-foreground">สร้างแคมเปญโฆษณาสำหรับสินค้านี้</p>
              <Link href={`/ads/create?productId=${product.id}`}>
                <Button>
                  <Target className="mr-2 h-4 w-4" />
                  สร้างแคมเปญ
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {product.adsCampaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <Link href={`/ads`} className="font-medium hover:underline">{campaign.name}</Link>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{campaign.platform}</Badge>
                        <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
