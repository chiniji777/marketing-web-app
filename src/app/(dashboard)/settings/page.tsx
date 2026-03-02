"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Settings,
  Building2,
  Users,
  CreditCard,
  Share2,
  ArrowRight,
  Save,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-locale"
import { getUserProfile, updateUserProfile } from "@/server/actions/settings"

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: string
}

export default function SettingsPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const data = await getUserProfile()
      setProfile(data as unknown as UserProfile)
      setName(data?.name ?? "")
    } catch {
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUserProfile({ name: name.trim() })
      toast.success("Profile updated")
    } catch {
      toast.error("Failed to update profile")
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

  const settingsLinks = [
    { href: "/settings/organization", icon: Building2, title: "Organization", description: "Manage organization name, logo, and details" },
    { href: "/settings/team", icon: Users, title: "Team", description: "Invite members and manage roles" },
    { href: "/settings/billing", icon: CreditCard, title: "Billing", description: "Manage subscription and payment methods" },
    { href: "/settings/integrations", icon: Share2, title: "Integrations", description: "Connect social media and third-party services" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader heading={t.settings.title} description={t.settings.title} />

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base">Your Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile?.image && <AvatarImage src={profile.image} />}
              <AvatarFallback className="text-lg">{(profile?.name ?? profile?.email ?? "U").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.name ?? "Unnamed"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <p className="text-xs text-muted-foreground">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((link) => {
          const Icon = link.icon
          return (
            <Card key={link.href} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={link.href}><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
