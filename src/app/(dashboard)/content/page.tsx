"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  ArrowUpDown,
  Hash,
  Mail,
  Video,
  Megaphone,
  Layout,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import { getContents, deleteContent, duplicateContent } from "@/server/actions/content"

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  PENDING_REVIEW: { label: "Pending Review", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  SCHEDULED: { label: "Scheduled", variant: "default" },
  PUBLISHED: { label: "Published", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  SOCIAL_POST: Hash,
  BLOG_POST: FileText,
  AD_COPY: Megaphone,
  EMAIL: Mail,
  LANDING_PAGE: Layout,
  VIDEO_SCRIPT: Video,
}

interface ContentItem {
  id: string
  title: string
  body: string
  contentType: string
  status: string
  tone: string | null
  language: string
  aiGenerated: boolean
  createdAt: string | Date
  updatedAt: string | Date
  createdBy: { id: string; name: string | null; image: string | null }
  tags: Array<{ id: string; name: string }>
  _count: { posts: number }
}

export default function ContentPage() {
  const router = useRouter()
  const t = useTranslations()
  const [contents, setContents] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [contentType, setContentType] = useState("all")
  const [status, setStatus] = useState("all")
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchContents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getContents({
        contentType: contentType === "all" ? undefined : contentType,
        status: status === "all" ? undefined : status,
        search: search || undefined,
        page: pagination.page,
        perPage: pagination.perPage,
      })
      setContents(result.contents as unknown as ContentItem[])
      setPagination(result.pagination)
    } catch {
      toast.error("Failed to load content")
    } finally {
      setIsLoading(false)
    }
  }, [contentType, status, search, pagination.page, pagination.perPage])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const handleDelete = async (id: string) => {
    try {
      await deleteContent(id)
      toast.success("Content deleted")
      fetchContents()
    } catch {
      toast.error("Failed to delete content")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateContent(id)
      toast.success("Content duplicated")
      fetchContents()
    } catch {
      toast.error("Failed to duplicate content")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading={t.content.title}
        description={t.content.subtitle}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/content/templates">Templates</Link>
          </Button>
          <Button asChild>
            <Link href="/content/generator">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={contentType} onValueChange={setContentType}>
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[300px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No content yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Create your first piece of content using the AI generator or start
                from scratch.
              </p>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/content/generator">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Manually
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/content/generator">
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Generate
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Content
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contents.map((content) => {
                  const TypeIcon = TYPE_ICONS[content.contentType] ?? FileText
                  const statusInfo = STATUS_MAP[content.status] ?? STATUS_MAP.DRAFT
                  const updatedAt = new Date(content.updatedAt)

                  return (
                    <TableRow
                      key={content.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/content/${content.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {content.title}
                            </p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {content.body.substring(0, 80)}
                              {content.body.length > 80 && "..."}
                            </p>
                          </div>
                          {content.aiGenerated && (
                            <Sparkles className="ml-1 mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {content.contentType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={content.createdBy.image ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {content.createdBy.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {content.createdBy.name ?? "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{content._count.posts}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {updatedAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/content/${content.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/content/${content.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(content.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(content.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{" "}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of{" "}
            {pagination.total} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
