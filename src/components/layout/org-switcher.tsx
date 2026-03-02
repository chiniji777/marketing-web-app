"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/hooks/use-organization"
import Link from "next/link"

interface Organization {
  id: string
  name: string
  slug: string
  role: string
}

export function OrgSwitcher() {
  const [open, setOpen] = useState(false)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const { organizationId, organizationName, switchOrganization } = useOrganization()

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/organizations")
        if (res.ok) {
          const data = await res.json()
          setOrgs(data)
        }
      } catch {
        // Silently fail — user will see current org only
      }
    }
    fetchOrgs()
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3 text-left font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              {organizationName?.[0]?.toUpperCase() ?? "O"}
            </div>
            <span className="truncate text-sm">{organizationName ?? "Select org"}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {orgs.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => {
                    if (org.id !== organizationId) {
                      switchOrganization(org.id)
                    }
                    setOpen(false)
                  }}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold">
                    {org.name[0]?.toUpperCase()}
                  </div>
                  <span className="ml-2 truncate">{org.name}</span>
                  {org.id === organizationId && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem asChild>
                <Link
                  href="/onboarding"
                  className="flex items-center"
                  onClick={() => setOpen(false)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
