"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Building2,
  Search,
  Users,
  Megaphone,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import { getAdminOrganizations } from "@/server/actions/admin"

interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: string
  _count: { memberships: number; campaigns: number; leads: number }
}

export default function AdminOrganizationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    try {
      const result = await getAdminOrganizations({ search: search || undefined, page, perPage: 20 })
      setOrganizations(result.organizations as unknown as Organization[])
      setTotalPages(result.pagination.totalPages)
    } catch {
      toast.error("Failed to load organizations")
    } finally {
      setIsLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Organizations" description="Manage all organizations on the platform" />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search organizations..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {organizations.length === 0 ? (
        <EmptyState icon={Building2} title="No organizations" description="No organizations found matching your search" />
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => (
            <Card key={org.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{org.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">@{org.slug} · Created {new Date(org.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{org._count.memberships}</span>
                    <span className="flex items-center gap-1"><Megaphone className="h-3.5 w-3.5" />{org._count.campaigns}</span>
                    <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" />{org._count.leads}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
