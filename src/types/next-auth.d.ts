import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isSuperAdmin: boolean
      activeOrganizationId: string
      activeOrganizationName: string
      activeOrganizationSlug: string
      activeRole: string
    } & DefaultSession["user"]
  }

  interface User {
    isSuperAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isSuperAdmin: boolean
    activeOrganizationId: string
    activeOrganizationName: string
    activeOrganizationSlug: string
    activeRole: string
  }
}
