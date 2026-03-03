import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getTenantPrisma } from "@/lib/prisma-extension"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Pencil,
  Sparkles,
  Calendar,
  Globe,
  User,
  Clock,
  FileText,
  Hash,
  Mail,
  Video,
  Megaphone,
  Layout,
} from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  SOCIAL_POST: "Social Post",
  BLOG_POST: "Blog Post",
  AD_COPY: "Ad Copy",
  EMAIL: "Email",
  LANDING_PAGE: "Landing Page",
  VIDEO_SCRIPT: "Video Script",
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  SOCIAL_POST: Hash,
  BLOG_POST: FileText,
  AD_COPY: Megaphone,
  EMAIL: Mail,
  LANDING_PAGE: Layout,
  VIDEO_SCRIPT: Video,
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  PENDING_REVIEW: { label: "Pending Review", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  SCHEDULED: { label: "Scheduled", variant: "default" },
  PUBLISHED: { label: "Published", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.activeOrganizationId) notFound()

  const db = getTenantPrisma(session.user.activeOrganizationId)
  const content = await db.content.findFirst({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, image: true, email: true } },
      tags: { select: { id: true, name: true } },
      posts: {
        include: {
          socialAccount: {
            select: { id: true, platform: true, accountName: true },
          },
        },
      },
    },
  })

  if (!content) notFound()

  const TypeIcon = TYPE_ICONS[content.contentType] ?? FileText
  const statusInfo = STATUS_MAP[content.status] ?? STATUS_MAP.DRAFT

  return (
    <div className="space-y-6">
      <PageHeader heading={content.title} description="" backHref="/content">
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <Button variant="outline" asChild>
            <Link href={`/content/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {content.featuredImage && (
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.featuredImage}
                    alt={content.title}
                    className="h-auto w-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {content.body}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">
                    {TYPE_LABELS[content.contentType] ?? content.contentType}
                  </p>
                </div>
              </div>

              {content.tone && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tone</p>
                    <p className="text-sm font-medium capitalize">{content.tone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Language</p>
                  <p className="text-sm font-medium uppercase">{content.language}</p>
                </div>
              </div>

              {content.aiGenerated && (
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">AI Generated</p>
                    <p className="text-sm font-medium">Yes</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={content.createdBy.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {content.createdBy.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">
                      {content.createdBy.name ?? content.createdBy.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {new Date(content.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last updated</p>
                  <p className="text-sm">
                    {new Date(content.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {content.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Posts */}
          {content.posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Scheduled Posts ({content.posts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {content.posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {post.socialAccount.platform.toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.socialAccount.accountName}
                      </p>
                    </div>
                    <Badge
                      variant={post.status === "PUBLISHED" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI Prompt */}
          {content.aiPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4" />
                  AI Prompt Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{content.aiPrompt}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
