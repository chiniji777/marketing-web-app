"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  MoreHorizontal,
  UserMinus,
  Shield,
} from "lucide-react"
import { toast } from "sonner"
import { getTeamMembers, inviteTeamMember, updateMemberRole, removeMember } from "@/server/actions/settings"

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access to all features" },
  { value: "manager", label: "Manager", description: "Can manage content and campaigns" },
  { value: "member", label: "Member", description: "Basic access to assigned tasks" },
]

interface TeamMember {
  id: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function TeamSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  const fetchData = useCallback(async () => {
    try {
      const data = await getTeamMembers()
      setMembers(data as unknown as TeamMember[])
    } catch {
      toast.error("Failed to load team members")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required")
      return
    }
    try {
      await inviteTeamMember(inviteEmail.trim(), inviteRole)
      toast.success("Member invited")
      setShowInviteDialog(false)
      setInviteEmail("")
      setInviteRole("member")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite member")
    }
  }

  const handleRoleChange = async (membershipId: string, role: string) => {
    try {
      await updateMemberRole(membershipId, role)
      toast.success("Role updated")
      fetchData()
    } catch {
      toast.error("Failed to update role")
    }
  }

  const handleRemove = async (membershipId: string) => {
    try {
      await removeMember(membershipId)
      toast.success("Member removed")
      fetchData()
    } catch {
      toast.error("Failed to remove member")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Team" description="Manage team members and roles" backHref="/settings">
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@company.com" />
                <p className="text-xs text-muted-foreground">User must have an existing account</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div>
                          <span>{r.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{r.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} className="w-full">Send Invitation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Invite team members to collaborate">
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Invite Member
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      {member.user.image && <AvatarImage src={member.user.image} />}
                      <AvatarFallback>{(member.user.name ?? member.user.email).charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name ?? "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.role === "admin" ? "default" : "secondary"} className="capitalize">
                      {member.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                      {member.role}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ROLES.filter((r) => r.value !== member.role).map((r) => (
                          <DropdownMenuItem key={r.value} onClick={() => handleRoleChange(member.id, r.value)}>
                            Change to {r.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(member.id)}>
                          <UserMinus className="mr-2 h-3.5 w-3.5" />Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
