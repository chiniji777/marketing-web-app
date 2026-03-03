"use client"

import { Suspense, useState, useCallback, useEffect } from "react"
import { useCompletion } from "@ai-sdk/react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  Copy,
  Save,
  RotateCcw,
  Loader2,
  Wand2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Globe,
  FileText,
  Mail,
  Video,
  Megaphone,
  Layout,
  Hash,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import { createContent } from "@/server/actions/content"
import { getProductsSimple, createProductContent } from "@/server/actions/product"

const CONTENT_TYPES = [
  { value: "SOCIAL_POST", label: "Social Post", icon: Hash },
  { value: "BLOG_POST", label: "Blog Post", icon: FileText },
  { value: "AD_COPY", label: "Ad Copy", icon: Megaphone },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "LANDING_PAGE", label: "Landing Page", icon: Layout },
  { value: "VIDEO_SCRIPT", label: "Video Script", icon: Video },
]

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
  { value: "urgent", label: "Urgent" },
  { value: "inspirational", label: "Inspirational" },
  { value: "educational", label: "Educational" },
  { value: "persuasive", label: "Persuasive" },
]

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "twitter", label: "Twitter/X", icon: Twitter },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "tiktok", label: "TikTok", icon: Globe },
  { value: "general", label: "General", icon: Globe },
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "th", label: "Thai" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
]

interface SimpleProduct {
  id: string
  name: string
  category: string | null
  marketingDataScore: number
}

export default function ContentGeneratorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Sparkles className="h-8 w-8 animate-pulse text-muted-foreground" /></div>}>
      <ContentGeneratorInner />
    </Suspense>
  )
}

function ContentGeneratorInner() {
  const searchParams = useSearchParams()
  const initialProductId = searchParams.get("productId") || ""

  const [contentType, setContentType] = useState("SOCIAL_POST")
  const [topic, setTopic] = useState("")
  const [tone, setTone] = useState("professional")
  const [platform, setPlatform] = useState("general")
  const [language, setLanguage] = useState("th")
  const [keywords, setKeywords] = useState("")
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<
    Array<{ content: string; type: string; timestamp: Date }>
  >([])

  // Product selector
  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState(initialProductId)

  useEffect(() => {
    getProductsSimple().then((data) => {
      setProducts(data as unknown as SimpleProduct[])
    }).catch(() => {})
  }, [])

  const { completion, complete, isLoading, stop } = useCompletion({
    api: "/api/ai/generate",
    onFinish: (_prompt, completionText) => {
      setGenerationHistory((prev) => [
        { content: completionText, type: contentType, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate content")
    },
  })

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("กรุณาใส่หัวข้อ")
      return
    }

    await complete("", {
      body: {
        contentType,
        topic,
        tone,
        language,
        platform: contentType === "SOCIAL_POST" ? platform : undefined,
        keywords: keywords || undefined,
        additionalInstructions: additionalInstructions || undefined,
        productId: selectedProductId || undefined,
      },
    })
  }, [contentType, topic, tone, language, platform, keywords, additionalInstructions, selectedProductId, complete])

  const handleCopy = useCallback(async () => {
    if (!completion) return
    await navigator.clipboard.writeText(completion)
    toast.success("คัดลอกแล้ว")
  }, [completion])

  const handleSave = useCallback(async () => {
    if (!completion) return
    setIsSaving(true)
    try {
      const title =
        topic.length > 100 ? topic.substring(0, 100) + "..." : topic

      if (selectedProductId) {
        // Save linked to product
        await createProductContent({
          productId: selectedProductId,
          title: `AI: ${title}`,
          body: completion,
          contentType: contentType as "SOCIAL_POST" | "BLOG_POST" | "AD_COPY" | "EMAIL" | "LANDING_PAGE" | "VIDEO_SCRIPT",
          tone,
          language,
          aiGenerated: true,
          aiPrompt: topic,
        })
      } else {
        // Save without product
        await createContent({
          title: `AI: ${title}`,
          body: completion,
          contentType: contentType as "SOCIAL_POST" | "BLOG_POST" | "AD_COPY" | "EMAIL" | "LANDING_PAGE" | "VIDEO_SCRIPT",
          tone,
          language,
          aiGenerated: true,
          aiPrompt: topic,
        })
      }
      toast.success("บันทึกเนื้อหาเรียบร้อย")
    } catch {
      toast.error("ไม่สามารถบันทึกได้")
    } finally {
      setIsSaving(false)
    }
  }, [completion, topic, contentType, tone, language, selectedProductId])

  const handleReset = useCallback(() => {
    setTopic("")
    setKeywords("")
    setAdditionalInstructions("")
  }, [])

  const wordCount = completion
    ? completion.split(/\s+/).filter(Boolean).length
    : 0
  const charCount = completion?.length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        heading="AI Content Generator"
        description="สร้างเนื้อหาการตลาดด้วย AI"
      >
        {completion && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              คัดลอก
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              บันทึก
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Panel — Controls */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="h-4 w-4" />
                ตั้งค่าเนื้อหา
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" />
                  เลือกสินค้า (ไม่บังคับ)
                </Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสินค้า..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ไม่ระบุสินค้า</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.category ? `(${p.category})` : ""}
                        {p.marketingDataScore > 0 && ` — ${p.marketingDataScore}%`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProductId && (
                  <p className="text-xs text-muted-foreground">
                    เนื้อหาจะถูกเชื่อมกับสินค้านี้ + AI จะใช้ข้อมูลการตลาดของสินค้าเป็น context
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>ประเภทเนื้อหา</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={contentType === type.value ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setContentType(type.value)}
                    >
                      <type.icon className="mr-2 h-4 w-4" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="topic">หัวข้อ / Brief *</Label>
                <Textarea
                  id="topic"
                  placeholder="เช่น โปรโมทครีมกันแดดตัวใหม่ SPF50+ สำหรับสาวออฟฟิศ..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>โทนเสียง</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {contentType === "SOCIAL_POST" && (
                <div className="space-y-2">
                  <Label>แพลตฟอร์ม</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map((p) => (
                      <Button
                        key={p.value}
                        variant={platform === p.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatform(p.value)}
                      >
                        <p.icon className="mr-1 h-3 w-3" />
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>ภาษา</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (ไม่บังคับ)</Label>
                <Input
                  id="keywords"
                  placeholder="เช่น ครีมกันแดด, SPF50, ผิวขาว"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">คำสั่งเพิ่มเติม (ไม่บังคับ)</Label>
                <Textarea
                  id="instructions"
                  placeholder="เช่น ใส่ CTA ลด 20% เฉพาะสัปดาห์นี้..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleGenerate}
                  disabled={isLoading || !topic.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      สร้างเนื้อหา
                    </>
                  )}
                </Button>
                {isLoading && (
                  <Button variant="outline" onClick={stop}>
                    หยุด
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel — Output */}
        <div className="space-y-6 lg:col-span-3">
          <Tabs defaultValue="output">
            <TabsList>
              <TabsTrigger value="output">ผลลัพธ์</TabsTrigger>
              <TabsTrigger value="history">
                ประวัติ
                {generationHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {generationHistory.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="output">
              <Card className="min-h-[500px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base">เนื้อหาที่สร้าง</CardTitle>
                  {completion && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{wordCount} คำ</span>
                      <span>{charCount} ตัวอักษร</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {completion ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {completion}
                    </div>
                  ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        AI กำลังเขียนเนื้อหา...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Sparkles className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">
                        พร้อมสร้างเนื้อหา
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        ตั้งค่าด้านซ้าย แล้วกดสร้างเนื้อหาเพื่อให้ AI เขียนให้
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="min-h-[500px]">
                <CardHeader>
                  <CardTitle className="text-base">ประวัติการสร้าง</CardTitle>
                </CardHeader>
                <CardContent>
                  {generationHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-muted-foreground">
                        ประวัติการสร้างจะแสดงที่นี่
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {generationHistory.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <Badge variant="outline">{item.type.replace("_", " ")}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="line-clamp-3 text-sm">{item.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={async () => {
                              await navigator.clipboard.writeText(item.content)
                              toast.success("คัดลอกแล้ว")
                            }}
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            คัดลอก
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
