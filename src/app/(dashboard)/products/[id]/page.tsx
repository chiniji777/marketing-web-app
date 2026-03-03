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
  BarChart3,
  Shield,
  Heart,
  Search as SearchIcon,
  Clock,
  MessageCircle,
  FileText,
  Mail,
  Megaphone,
  Globe,
  Plus,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import {
  getProduct,
  updateProductMarketingData,
  getProductContents,
  getProductMentions,
  getProductEmailCampaigns,
  getProductCampaigns,
} from "@/server/actions/product"

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ContentItem { id: string; title: string; contentType: string; status: string; createdAt: any; updatedAt: any; aiGenerated?: boolean }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MentionItem { id: string; platform: string; authorName: string | null; content: string; sentiment: string | null; mentionedAt: any }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EmailCampaignItem { id: string; name: string; subject: string; status: string; updatedAt: any }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AdCampaignItem { id: string; name: string; platform: string; status: string; budget: number | null; updatedAt: any }

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

  // Tab data states
  const [contents, setContents] = useState<ContentItem[]>([])
  const [mentions, setMentions] = useState<MentionItem[]>([])
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaignItem[]>([])
  const [adCampaigns, setAdCampaigns] = useState<AdCampaignItem[]>([])
  const [tabDataLoaded, setTabDataLoaded] = useState<Set<string>>(new Set())

  const loadProduct = useCallback(async () => {
    try {
      const data = await getProduct(id)
      setProduct(data as unknown as ProductData)
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

  useEffect(() => { loadProduct() }, [loadProduct])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Lazy load tab data
  const loadTabData = useCallback(async (tab: string) => {
    if (tabDataLoaded.has(tab)) return
    try {
      switch (tab) {
        case "content": {
          const res = await getProductContents(id)
          setContents(res.contents as unknown as ContentItem[])
          break
        }
        case "social": {
          const res = await getProductMentions(id)
          setMentions(res.mentions as unknown as MentionItem[])
          break
        }
        case "email": {
          const res = await getProductEmailCampaigns(id)
          setEmailCampaigns(res.campaigns as unknown as EmailCampaignItem[])
          break
        }
        case "campaigns": {
          const res = await getProductCampaigns(id)
          setAdCampaigns(res.campaigns as unknown as AdCampaignItem[])
          break
        }
      }
      setTabDataLoaded(prev => new Set(prev).add(tab))
    } catch {
      // Silently fail — tab will show empty state
    }
  }, [id, tabDataLoaded])

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

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "AI request failed")
      }

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
          toast.error("ไม่สามารถอ่านข้อมูลจาก AI ได้ ลองถามใหม่อีกครั้ง")
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI ไม่สามารถตอบได้")
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

  const startAIConversation = () => { sendToAI(messages) }

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

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      ACTIVE: "เปิดใช้งาน", DRAFT: "แบบร่าง", ARCHIVED: "เก็บถาวร",
      SCHEDULED: "กำหนดเวลา", PUBLISHED: "เผยแพร่แล้ว", PENDING_REVIEW: "รอตรวจสอบ",
      APPROVED: "อนุมัติแล้ว", PAUSED: "หยุดชั่วคราว",
    }
    return map[s] || s
  }

  const sentimentColor = (s: string | null) => {
    if (s === "POSITIVE") return "text-green-600"
    if (s === "NEGATIVE") return "text-red-600"
    return "text-gray-500"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading={product.name}
        description={product.description || "ยังไม่มีรายละเอียด"}
        backHref="/products"
      >
        <div className="flex gap-2">
          <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
            {statusLabel(product.status)}
          </Badge>
          <Badge variant="outline">
            <BarChart3 className="mr-1 h-3 w-3" />
            {product.marketingDataScore}%
          </Badge>
        </div>
      </PageHeader>

      <Tabs defaultValue={defaultTab} onValueChange={(tab) => loadTabData(tab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <Package className="mr-1 h-3 w-3" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-1 h-3 w-3" />
            AI วิเคราะห์
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Users className="mr-1 h-3 w-3" />
            กลุ่มเป้าหมาย
          </TabsTrigger>
          <TabsTrigger value="content" onClick={() => loadTabData("content")}>
            <FileText className="mr-1 h-3 w-3" />
            เนื้อหา
          </TabsTrigger>
          <TabsTrigger value="social" onClick={() => loadTabData("social")}>
            <Globe className="mr-1 h-3 w-3" />
            Social Listening
          </TabsTrigger>
          <TabsTrigger value="email" onClick={() => loadTabData("email")}>
            <Mail className="mr-1 h-3 w-3" />
            อีเมล
          </TabsTrigger>
          <TabsTrigger value="campaigns" onClick={() => loadTabData("campaigns")}>
            <Megaphone className="mr-1 h-3 w-3" />
            แคมเปญ
          </TabsTrigger>
        </TabsList>

        {/* ═══ Tab 1: Overview ═══ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">คะแนนการตลาด</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{product.marketingDataScore}/100</p>
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

          {/* Quick marketing summary */}
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
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Heart className="h-4 w-4" /> อารมณ์กระตุ้น
                  </h4>
                  {renderArrayList(product.emotionalTriggers, "ยังไม่มีข้อมูล")}
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <SearchIcon className="h-4 w-4" /> Keywords
                  </h4>
                  {product.keywords && product.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {product.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {product.marketingDataScore === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">ยังไม่มีข้อมูลการตลาด</h3>
                <p className="mb-4 text-sm text-muted-foreground">ใช้ AI วิเคราะห์เพื่อรวบรวมข้อมูลสำคัญสำหรับการทำโฆษณา</p>
                <Link href={`/products/${id}?tab=ai`}>
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" />
                    เริ่ม AI วิเคราะห์
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ Tab 2: AI Analysis ═══ */}
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
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
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

        {/* ═══ Tab 3: Target Audience ═══ */}
        <TabsContent value="audience" className="space-y-4">
          {product.marketingDataScore === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">ยังไม่มีข้อมูลกลุ่มเป้าหมาย</h3>
                <p className="mb-4 text-sm text-muted-foreground">ใช้ AI วิเคราะห์เพื่อระบุกลุ่มลูกค้าเป้าหมาย</p>
                <Link href={`/products/${id}?tab=ai`}>
                  <Button><Sparkles className="mr-2 h-4 w-4" />เริ่ม AI วิเคราะห์</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" /> ข้อมูลประชากร
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.targetAudience ? (
                    <div className="space-y-2 text-sm">
                      {Object.entries(product.targetAudience).map(([key, val]) => (
                        <div key={key}>
                          <span className="font-medium capitalize">{key}: </span>
                          <span className="text-muted-foreground">
                            {Array.isArray(val) ? val.join(", ") : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </CardContent>
              </Card>

              {/* Ideal Customer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4" /> ลูกค้าในอุดมคติ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.idealCustomerProfile ? (
                    <div className="space-y-2 text-sm">
                      {Object.entries(product.idealCustomerProfile).map(([key, val]) => (
                        <div key={key}>
                          <span className="font-medium capitalize">{key}: </span>
                          <span className="text-muted-foreground">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </CardContent>
              </Card>

              {/* Pain Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" /> ปัญหาที่ลูกค้ามี (Pain Points)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderArrayList(product.painPoints, "ยังไม่มีข้อมูล")}
                </CardContent>
              </Card>

              {/* Emotional Triggers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" /> อารมณ์กระตุ้นการซื้อ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderArrayList(product.emotionalTriggers, "ยังไม่มีข้อมูล")}
                </CardContent>
              </Card>

              {/* Customer Objections */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" /> ข้อโต้แย้ง/ข้อกังวลของลูกค้า
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.customerObjections && product.customerObjections.length > 0 ? (
                    <div className="space-y-3">
                      {product.customerObjections.map((obj: Record<string, unknown>, i: number) => (
                        <div key={i} className="rounded-lg border p-3">
                          <p className="text-sm font-medium">{String(obj.objection || "")}</p>
                          {obj.response ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              วิธีตอบ: {String(obj.response)}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </CardContent>
              </Card>

              {/* Competitors */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" /> คู่แข่ง
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {product.competitors && product.competitors.length > 0 ? (
                    <div className="space-y-3">
                      {product.competitors.map((c: Record<string, unknown>, i: number) => (
                        <div key={i} className="rounded-lg border p-3">
                          <p className="text-sm font-medium">{String(c.name || "ไม่ระบุชื่อ")}</p>
                          <div className="mt-1 grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                            {c.strengths ? <p>จุดแข็ง: {String(c.strengths)}</p> : null}
                            {c.weaknesses ? <p>จุดอ่อน: {String(c.weaknesses)}</p> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                  )}
                </CardContent>
              </Card>

              {/* Market positioning */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" /> ข้อมูลเพิ่มเติม
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>ตำแหน่งตลาด:</strong> {product.marketPosition || "-"}</p>
                  <p><strong>Brand Voice:</strong> {product.brandVoice || "-"}</p>
                  <p><strong>Seasonality:</strong> {product.seasonality || "-"}</p>
                </CardContent>
              </Card>

              {/* Keywords */}
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
            </div>
          )}
        </TabsContent>

        {/* ═══ Tab 4: Content ═══ */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">เนื้อหาของสินค้านี้</h3>
            <Link href={`/content/generator?productId=${product.id}`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                สร้างเนื้อหา AI
              </Button>
            </Link>
          </div>

          {contents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">ยังไม่มีเนื้อหา</h3>
                <p className="mb-4 text-sm text-muted-foreground">สร้างเนื้อหาด้วย AI สำหรับสินค้านี้</p>
                <Link href={`/content/generator?productId=${product.id}`}>
                  <Button><Sparkles className="mr-2 h-4 w-4" />สร้างเนื้อหา AI</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contents.map((content) => (
                <Card
                  key={content.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/content/${content.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <span className="font-medium">{content.title}</span>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="outline" className="text-xs">{content.contentType.replace("_", " ")}</Badge>
                        <Badge variant={content.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">
                          {statusLabel(content.status)}
                        </Badge>
                        {content.aiGenerated && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="mr-1 h-2.5 w-2.5" />AI
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Tab 5: Social Listening ═══ */}
        <TabsContent value="social" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Social Listening</h3>
          </div>

          {mentions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">ยังไม่มีข้อมูล Social Mentions</h3>
                <p className="text-sm text-muted-foreground">ระบบจะเก็บข้อมูลจาก social media เมื่อเชื่อมต่อบัญชี</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mentions.map((mention) => (
                <Card key={mention.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{mention.platform}</Badge>
                          {mention.authorName && (
                            <span className="text-sm font-medium">{mention.authorName}</span>
                          )}
                          <span className={`text-xs font-medium ${sentimentColor(mention.sentiment)}`}>
                            {mention.sentiment || "NEUTRAL"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{mention.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(mention.mentionedAt).toLocaleDateString("th-TH", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Tab 6: Email ═══ */}
        <TabsContent value="email" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">อีเมลแคมเปญ</h3>
            <Link href={`/email/create?productId=${product.id}`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                สร้างแคมเปญอีเมล
              </Button>
            </Link>
          </div>

          {emailCampaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">ยังไม่มีแคมเปญอีเมล</h3>
                <p className="mb-4 text-sm text-muted-foreground">สร้างแคมเปญอีเมลสำหรับสินค้านี้</p>
                <Link href={`/email/create?productId=${product.id}`}>
                  <Button><Mail className="mr-2 h-4 w-4" />สร้างแคมเปญอีเมล</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {emailCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/email/${campaign.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">หัวข้อ: {campaign.subject}</p>
                      <Badge variant={campaign.status === "SENT" ? "default" : "secondary"} className="mt-1 text-xs">
                        {statusLabel(campaign.status)}
                      </Badge>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ Tab 7: Campaigns ═══ */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">แคมเปญโฆษณา</h3>
            <Link href={`/ads/create?productId=${product.id}`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                สร้างแคมเปญ
              </Button>
            </Link>
          </div>

          {/* AI Campaign Suggestion */}
          {product.marketingDataScore >= 60 && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    <Sparkles className="mr-1 inline h-4 w-4" />
                    พร้อมสร้างแคมเปญ AI
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ข้อมูลการตลาดเพียงพอแล้ว — AI สามารถแนะนำแคมเปญให้อัตโนมัติ
                  </p>
                </div>
                <Link href={`/ads/create?productId=${product.id}&ai=true`}>
                  <Button variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    สร้างแคมเปญ AI
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {product.adsCampaigns.length === 0 && adCampaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">ยังไม่มีแคมเปญ</h3>
                <p className="mb-4 text-sm text-muted-foreground">สร้างแคมเปญโฆษณาสำหรับสินค้านี้</p>
                <Link href={`/ads/create?productId=${product.id}`}>
                  <Button><Target className="mr-2 h-4 w-4" />สร้างแคมเปญ</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(product.adsCampaigns.length > 0 ? product.adsCampaigns : adCampaigns).map((campaign) => (
                <Card
                  key={campaign.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/ads/${campaign.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <span className="font-medium">{campaign.name}</span>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="outline" className="text-xs">{campaign.platform}</Badge>
                        <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                          {statusLabel(campaign.status)}
                        </Badge>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
