"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"
import { getOrganizationSettings, updateOrganizationSettings } from "@/server/actions/settings"

interface OrgSettings {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: string
}

export default function OrganizationSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [org, setOrg] = useState<OrgSettings | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const data = await getOrganizationSettings()
      if (data) {
        setOrg(data as unknown as OrgSettings)
        setName(data.name)
        setSlug(data.slug)
      }
    } catch {
      toast.error("Failed to load organization settings")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Organization name is required")
      return
    }
    setIsSaving(true)
    try {
      await updateOrganizationSettings({
        name: name.trim(),
        slug: slug.trim() || undefined,
      })
      toast.success("Organization updated")
    } catch {
      toast.error("Failed to update organization")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Organization" description="Manage your organization details" />

      <Card>
        <CardHeader><CardTitle className="text-base">Organization Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{org?.name}</p>
              <p className="text-sm text-muted-foreground">Created {org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : ""}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="organization-slug" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
