"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Copy,
  Sparkles,
  Loader2,
  Hash,
  Mail,
  Video,
  Megaphone,
  Layout,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { useAIAssist } from "@/hooks/use-ai-assist"
import { getTemplates, createTemplate, deleteTemplate } from "@/server/actions/content"

const TYPE_ICONS: Record<string, typeof FileText> = {
  SOCIAL_POST: Hash,
  BLOG_POST: FileText,
  AD_COPY: Megaphone,
  EMAIL: Mail,
  LANDING_PAGE: Layout,
  VIDEO_SCRIPT: Video,
}

interface TemplateItem {
  id: string
  name: string
  description: string | null
  contentType: string
  body: string
  isGlobal: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export default function ContentTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // New template form
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newType, setNewType] = useState("SOCIAL_POST")
  const [newBody, setNewBody] = useState("")

  const ai = useAIAssist()

  const handleAISuggest = async () => {
    const typeMap: Record<string, string> = {
      SOCIAL_POST: "social_post",
      AD_COPY: "ad_copy",
      EMAIL: "email_content",
      BLOG_POST: "improve_text",
      LANDING_PAGE: "ad_copy",
      VIDEO_SCRIPT: "improve_text",
    }
    const aiType = (typeMap[newType] || "social_post") as Parameters<typeof ai.generate>[0]
    const result = await ai.generate(aiType, {
      campaignName: newName || "Content Template",
      contentType: newType,
      description: newDescription || undefined,
      tone: "professional",
    })
    if (result) {
      setNewBody(result)
      toast.success("AI แนะนำเทมเพลตสำเร็จ")
    }
  }

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getTemplates({
        contentType: filterType === "all" ? undefined : filterType,
        search: search || undefined,
      })
      setTemplates(result as unknown as TemplateItem[])
    } catch {
      toast.error("Failed to load templates")
    } finally {
      setIsLoading(false)
    }
  }, [filterType, search])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreate = async () => {
    if (!newName.trim() || !newBody.trim()) {
      toast.error("Name and body are required")
      return
    }
    setIsCreating(true)
    try {
      await createTemplate({
        name: newName,
        description: newDescription || undefined,
        contentType: newType as "SOCIAL_POST" | "BLOG_POST" | "AD_COPY" | "EMAIL" | "LANDING_PAGE" | "VIDEO_SCRIPT",
        body: newBody,
      })
      toast.success("Template created")
      setIsDialogOpen(false)
      setNewName("")
      setNewDescription("")
      setNewBody("")
      setNewType("SOCIAL_POST")
      fetchTemplates()
    } catch {
      toast.error("Failed to create template")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id)
      toast.success("Template deleted")
      fetchTemplates()
    } catch {
      toast.error("Failed to delete template")
    }
  }

  const handleCopyBody = async (body: string) => {
    await navigator.clipboard.writeText(body)
    toast.success("Template body copied")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Content Templates"
        description="Reusable templates for your marketing content"
        backHref="/content"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for generating content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tpl-name">Template Name *</Label>
                  <Input
                    id="tpl-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Product Launch Post"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOCIAL_POST">Social Post</SelectItem>
                      <SelectItem value="BLOG_POST">Blog Post</SelectItem>
                      <SelectItem value="AD_COPY">Ad Copy</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="LANDING_PAGE">Landing Page</SelectItem>
                      <SelectItem value="VIDEO_SCRIPT">Video Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-desc">Description</Label>
                <Input
                  id="tpl-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this template"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tpl-body">Template Body *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={ai.isLoading}
                  >
                    {ai.isLoading ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                    )}
                    AI แนะนำเทมเพลต
                  </Button>
                </div>
                <Textarea
                  id="tpl-body"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Write your template content here. Use {{variable}} for dynamic content."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{variable}}"} syntax for dynamic placeholders.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="SOCIAL_POST">Social Post</SelectItem>
            <SelectItem value="BLOG_POST">Blog Post</SelectItem>
            <SelectItem value="AD_COPY">Ad Copy</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="LANDING_PAGE">Landing Page</SelectItem>
            <SelectItem value="VIDEO_SCRIPT">Video Script</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-[150px]" />
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No templates yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create reusable templates to speed up your content creation.
            </p>
            <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const TypeIcon = TYPE_ICONS[template.contentType] ?? FileText

            return (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.contentType.replace("_", " ")}
                          </Badge>
                          {template.isGlobal && (
                            <Badge variant="secondary" className="text-xs">
                              <Globe className="mr-1 h-3 w-3" />
                              Global
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="line-clamp-4 text-xs text-muted-foreground">
                      {template.body}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link
                      href={`/content/generator?template=${template.id}`}
                    >
                      <Sparkles className="mr-2 h-3 w-3" />
                      Use
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopyBody(template.body)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {!template.isGlobal && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
