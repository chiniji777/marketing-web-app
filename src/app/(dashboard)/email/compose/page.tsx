"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Send,
  Save,
  Loader2,
  Eye,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { createEmailCampaign } from "@/server/actions/email"
import { getEmailTemplates } from "@/server/actions/email"
import { useAIAssist } from "@/hooks/use-ai-assist"

interface Template {
  id: string
  name: string
  subject: string | null
  htmlContent: string
}

export default function ComposeEmailPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [senderName, setSenderName] = useState("")
  const [senderEmail, setSenderEmail] = useState("")
  const [replyTo, setReplyTo] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [textContent, setTextContent] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")

  const aiSubject = useAIAssist()
  const aiContent = useAIAssist()

  const handleAISubject = async () => {
    const result = await aiSubject.generate("email_subject", {
      campaignName: name,
      topic: subject || name,
    })
    if (result) {
      // Extract first subject line suggestion
      const lines = result.split("\n").filter((l: string) => l.trim())
      if (lines.length > 0) {
        const firstLine = lines[0].replace(/^\d+[\.\)]\s*/, "").trim()
        setSubject(firstLine)
        toast.success("AI แนะนำหัวข้ออีเมลแล้ว")
      }
    }
  }

  const handleAIContent = async () => {
    const result = await aiContent.generate("email_content", {
      campaignName: name,
      subject,
      tone: "professional",
    })
    if (result) {
      setHtmlContent(result)
      toast.success("AI สร้างเนื้อหาอีเมลแล้ว")
    }
  }

  useEffect(() => {
    getEmailTemplates().then((data) => {
      setTemplates(data as unknown as Template[])
    }).catch(() => {
      // templates are optional
    })
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      if (template.subject) setSubject(template.subject)
      setHtmlContent(template.htmlContent)
    }
  }

  const handleSave = async (sendNow: boolean) => {
    if (!name.trim()) {
      toast.error("Campaign name is required")
      return
    }
    if (!subject.trim()) {
      toast.error("Subject line is required")
      return
    }
    if (!htmlContent.trim() && !textContent.trim()) {
      toast.error("Email content is required")
      return
    }

    setIsSaving(true)
    try {
      await createEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        htmlContent: htmlContent.trim(),
        textContent: textContent.trim() || undefined,
        templateId: selectedTemplateId || undefined,
        senderName: senderName.trim() || undefined,
        senderEmail: senderEmail.trim() || undefined,
        replyTo: replyTo.trim() || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      })
      toast.success(sendNow ? "Campaign scheduled" : "Campaign saved as draft")
      router.push("/email")
    } catch {
      toast.error("Failed to save campaign")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Compose Email" description="Create a new email campaign" backHref="/email" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Campaign Details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Campaign Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., March Newsletter" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Subject Line *</Label>
                  <Button variant="ghost" size="sm" onClick={handleAISubject} disabled={aiSubject.isLoading}>
                    {aiSubject.isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    AI แนะนำ
                  </Button>
                </div>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What subscribers will see in their inbox" />
              </div>
              <div className="space-y-2">
                <Label>Preview Text</Label>
                <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Short text shown after the subject in inbox" />
              </div>
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Email Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleAIContent} disabled={aiContent.isLoading}>
                    {aiContent.isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    AI สร้างเนื้อหา
                  </Button>
                  {htmlContent && (
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                      <Eye className="mr-2 h-3 w-3" />{showPreview ? "Edit" : "Preview"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Start from Template</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showPreview ? (
                <div className="rounded-lg border bg-white p-6">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>HTML Content</Label>
                    <Textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      rows={12}
                      placeholder="<html>...</html> or paste your email HTML here"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plain Text (fallback)</Label>
                    <Textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={4}
                      placeholder="Plain text version for email clients that don't support HTML"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sender Settings */}
          <Card>
            <CardHeader><CardTitle className="text-base">Sender Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sender Name</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your Company" />
              </div>
              <div className="space-y-2">
                <Label>Sender Email</Label>
                <Input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="noreply@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Reply-To</Label>
                <Input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="support@company.com" />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader><CardTitle className="text-base">Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Send At</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave empty to save as draft</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button onClick={() => handleSave(false)} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            {scheduledAt && (
              <Button onClick={() => handleSave(true)} disabled={isSaving} variant="outline" className="w-full">
                <Send className="mr-2 h-4 w-4" />Schedule Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
