import { auth } from "@/lib/auth"
import { getFacebookOAuthUrl } from "@/lib/facebook"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !session.user.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const redirectUri = `${baseUrl}/api/facebook/auth/callback`

  const state = crypto.randomBytes(32).toString("hex")
  // Encode org + user info in state for the callback
  const statePayload = Buffer.from(
    JSON.stringify({
      token: state,
      organizationId: session.user.activeOrganizationId,
      userId: session.user.id,
    })
  ).toString("base64url")

  const url = getFacebookOAuthUrl(redirectUri, statePayload)
  return NextResponse.redirect(url)
}
