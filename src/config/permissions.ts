import type { MemberRole } from "@/generated/prisma/client"

type Permission =
  | "content:create"
  | "content:edit"
  | "content:delete"
  | "content:publish"
  | "content:approve"
  | "campaign:create"
  | "campaign:edit"
  | "campaign:delete"
  | "campaign:budget"
  | "lead:view"
  | "lead:edit"
  | "lead:assign"
  | "lead:delete"
  | "ads:manage"
  | "ads:budget"
  | "email:create"
  | "email:send"
  | "email:delete"
  | "seo:manage"
  | "report:create"
  | "report:export"
  | "settings:organization"
  | "settings:team"
  | "settings:billing"
  | "settings:integrations"

const PERMISSIONS: Record<Permission, MemberRole[]> = {
  "content:create": ["ADMIN", "MANAGER", "MEMBER"],
  "content:edit": ["ADMIN", "MANAGER", "MEMBER"],
  "content:delete": ["ADMIN", "MANAGER"],
  "content:publish": ["ADMIN", "MANAGER"],
  "content:approve": ["ADMIN", "MANAGER"],

  "campaign:create": ["ADMIN", "MANAGER"],
  "campaign:edit": ["ADMIN", "MANAGER"],
  "campaign:delete": ["ADMIN"],
  "campaign:budget": ["ADMIN"],

  "lead:view": ["ADMIN", "MANAGER", "MEMBER"],
  "lead:edit": ["ADMIN", "MANAGER", "MEMBER"],
  "lead:assign": ["ADMIN", "MANAGER"],
  "lead:delete": ["ADMIN"],

  "ads:manage": ["ADMIN", "MANAGER"],
  "ads:budget": ["ADMIN"],

  "email:create": ["ADMIN", "MANAGER"],
  "email:send": ["ADMIN", "MANAGER"],
  "email:delete": ["ADMIN"],

  "seo:manage": ["ADMIN", "MANAGER"],

  "report:create": ["ADMIN", "MANAGER"],
  "report:export": ["ADMIN", "MANAGER", "MEMBER"],

  "settings:organization": ["ADMIN"],
  "settings:team": ["ADMIN"],
  "settings:billing": ["ADMIN"],
  "settings:integrations": ["ADMIN", "MANAGER"],
}

export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return PERMISSIONS[permission]?.includes(role) ?? false
}

export function checkPermissions(role: MemberRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

export type { Permission }
