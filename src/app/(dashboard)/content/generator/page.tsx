"use client"

import { useState, useCallback } from "react"
import { useCompletion } from "@ai-sdk/react"
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
} from "lucide-react"
import { toast } from "sonner"
import { createContent } from "@/server/actions/content"

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

export default function ContentGeneratorPage() {
  const [contentType, setContentType] = useState("SOCIAL_POST")
  const [topic, setTopic] = useState("")
  const [tone, setTone] = useState("professional")
  const [platform, setPlatform] = useState("general")
  const [language, setLanguage] = useState("en")
  const [keywords, setKeywords] = useState("")
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<
    Array<{ content: string; type: string; timestamp: Date }>
  >([])

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
      toast.error("Please enter a topic")
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
      },
    })
  }, [contentType, topic, tone, language, platform, keywords, additionalInstructions, complete])

  const handleCopy = useCallback(async () => {
    if (!completion) return
    await navigator.clipboard.writeText(completion)
    toast.success("Copied to clipboard")
  }, [completion])

  const handleSave = useCallback(async () => {
    if (!completion) return
    setIsSaving(true)
    try {
      const title =
        topic.length > 100 ? topic.substring(0, 100) + "..." : topic
      await createContent({
        title: `AI: ${title}`,
        body: completion,
        contentType: contentType as "SOCIAL_POST" | "BLOG_POST" | "AD_COPY" | "EMAIL" | "LANDING_PAGE" | "VIDEO_SCRIPT",
        tone,
        language,
        aiGenerated: true,
        aiPrompt: topic,
      })
      toast.success("Content saved to your library")
    } catch {
      toast.error("Failed to save content")
    } finally {
      setIsSaving(false)
    }
  }, [completion, topic, contentType, tone, language])

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
        description="Create marketing content powered by AI"
      >
        {completion && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save to Library
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
                Content Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
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
                <Label htmlFor="topic">Topic / Brief *</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., Launch of our new eco-friendly water bottle for health-conscious millennials..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
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
                  <Label>Platform</Label>
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
                <Label>Language</Label>
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
                <Label htmlFor="keywords">Keywords (optional)</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., sustainable, eco-friendly, BPA-free"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Additional Instructions (optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="e.g., Include a call-to-action for 20% off..."
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
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                {isLoading && (
                  <Button variant="outline" onClick={stop}>
                    Stop
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
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="history">
                History
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
                  <CardTitle className="text-base">Generated Content</CardTitle>
                  {completion && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{wordCount} words</span>
                      <span>{charCount} chars</span>
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
                        AI is crafting your content...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Sparkles className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">
                        Ready to generate
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Fill in the settings on the left and click Generate to
                        create AI-powered marketing content.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="min-h-[500px]">
                <CardHeader>
                  <CardTitle className="text-base">Generation History</CardTitle>
                </CardHeader>
                <CardContent>
                  {generationHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-sm text-muted-foreground">
                        Your generation history will appear here
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
                              toast.success("Copied to clipboard")
                            }}
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            Copy
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
