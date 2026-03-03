"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  Eye,
  Sparkles,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useAIAssist } from "@/hooks/use-ai-assist"
import { getEmailTemplates, createEmailTemplate, deleteEmailTemplate } from "@/server/actions/email"

const CATEGORIES = ["Newsletter", "Welcome", "Promotional", "Transactional", "Announcement", "Other"]

interface EmailTemplate {
  id: string
  name: string
  subject: string | null
  htmlContent: string
  category: string | null
  createdAt: string
  _count: { emailCampaigns: number }
}

export default function EmailTemplatesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("")
  const [htmlContent, setHtmlContent] = useState("")

  const ai = useAIAssist()

  const handleAIGenerate = async () => {
    const result = await ai.generate("email_content", {
      campaignName: name || "Email Template",
      subject: subject || undefined,
      category: category || undefined,
      tone: "professional",
    })
    if (result) {
      setHtmlContent(result)
      toast.success("AI สร้างเทมเพลตสำเร็จ")
    }
  }

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await getEmailTemplates()
      setTemplates(data as unknown as EmailTemplate[])
    } catch {
      toast.error("Failed to load templates")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Template name is required")
      return
    }
    if (!htmlContent.trim()) {
      toast.error("HTML content is required")
      return
    }
    try {
      await createEmailTemplate({
        name: name.trim(),
        htmlContent: htmlContent.trim(),
        category: category || undefined,
      })
      toast.success("Template created")
      setShowCreateDialog(false)
      setName("")
      setSubject("")
      setCategory("")
      setHtmlContent("")
      fetchTemplates()
    } catch {
      toast.error("Failed to create template")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEmailTemplate(id)
      toast.success("Template deleted")
      fetchTemplates()
    } catch {
      toast.error("Failed to delete template")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Email Templates" description="Manage your reusable email templates" backHref="/email">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Monthly Newsletter" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Subject Line</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional default subject" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>HTML Content *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerate}
                    disabled={ai.isLoading}
                  >
                    {ai.isLoading ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                    )}
                    AI สร้างเทมเพลต
                  </Button>
                </div>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={12}
                  placeholder="Paste your email HTML template here"
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="rounded-lg border bg-white p-6">
              <div dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {templates.length === 0 ? (
        <EmptyState icon={FileText} title="No templates" description="Create reusable email templates to speed up campaign creation">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Create Template
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.subject && (
                      <p className="mt-1 text-sm text-muted-foreground">{template.subject}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                        <Eye className="mr-2 h-3.5 w-3.5" />Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {template.category && <Badge variant="outline">{template.category}</Badge>}
                  <span>{template._count.emailCampaigns} campaigns</span>
                  <span>·</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
