import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const publicRoutes = ["/", "/pricing", "/features", "/contact"]
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]
const apiAuthPrefix = "/api/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const path = nextUrl.pathname

  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)
  const isAdminRoute = path.startsWith("/admin")
  const isApiAuth = path.startsWith(apiAuthPrefix)
  const isApi = path.startsWith("/api")

  if (isApiAuth) return NextResponse.next()

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if (!isPublicRoute && !isAuthRoute && !isLoggedIn && !isApi) {
    const callbackUrl = encodeURIComponent(path)
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    )
  }

  if (isApi && !isLoggedIn && !isApiAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isAdminRoute) {
    const authData = req.auth as unknown as Record<string, unknown> | null
    const userData = authData?.user as Record<string, unknown> | undefined
    if (!userData?.isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
  }

  if (isLoggedIn) {
    const authData = req.auth as unknown as Record<string, unknown> | null
    const user = authData?.user as Record<string, unknown> | undefined
    const orgId = user?.activeOrganizationId as string | undefined
    const role = user?.activeRole as string | undefined
    const userId = user?.id as string | undefined

    if (orgId) {
      const headers = new Headers(req.headers)
      headers.set("x-organization-id", orgId)
      headers.set("x-user-role", role || "MEMBER")
      headers.set("x-user-id", userId || "")
      return NextResponse.next({ request: { headers } })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
