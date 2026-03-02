import { prisma } from "@/lib/prisma"
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getFacebookUser,
  getAdAccounts,
} from "@/lib/facebook"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const stateParam = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/ads?error=${encodeURIComponent(error)}`, req.nextUrl.origin)
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL("/ads?error=missing_params", req.nextUrl.origin)
    )
  }

  // Decode state
  let stateData: { organizationId: string; userId: string }
  try {
    stateData = JSON.parse(Buffer.from(stateParam, "base64url").toString())
  } catch {
    return NextResponse.redirect(
      new URL("/ads?error=invalid_state", req.nextUrl.origin)
    )
  }

  const { organizationId, userId } = stateData

  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectUri = `${baseUrl}/api/facebook/auth/callback`

    // Exchange code for short-lived token
    const shortTokenRes = await exchangeCodeForToken(code, redirectUri)

    // Exchange for long-lived token (~60 days)
    const longTokenRes = await exchangeForLongLivedToken(shortTokenRes.access_token)
    const accessToken = longTokenRes.access_token
    const expiresIn = longTokenRes.expires_in || 5184000 // default 60 days

    // Get Facebook user info
    const fbUser = await getFacebookUser(accessToken)

    // Get ad accounts
    const adAccounts = await getAdAccounts(accessToken)

    // Upsert SocialAccount for Facebook connection
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        organizationId_platform_platformAccountId: {
          organizationId,
          platform: "FACEBOOK",
          platformAccountId: fbUser.id,
        },
      },
      update: {
        accessToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        accountName: fbUser.name,
        isActive: true,
        metadata: { email: fbUser.email, adAccountCount: adAccounts.length },
      },
      create: {
        organizationId,
        platform: "FACEBOOK",
        platformAccountId: fbUser.id,
        accountName: fbUser.name,
        accessToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        metadata: { email: fbUser.email, adAccountCount: adAccounts.length },
      },
    })

    // Upsert FacebookAdAccounts
    for (const acc of adAccounts) {
      await prisma.facebookAdAccount.upsert({
        where: {
          organizationId_adAccountId: {
            organizationId,
            adAccountId: acc.adAccountId,
          },
        },
        update: {
          adAccountName: acc.name,
          currency: acc.currency,
          timezone: acc.timezone,
          accountStatus: acc.accountStatus,
          businessId: acc.businessId,
          businessName: acc.businessName,
          isActive: true,
        },
        create: {
          organizationId,
          socialAccountId: socialAccount.id,
          adAccountId: acc.adAccountId,
          adAccountName: acc.name,
          currency: acc.currency,
          timezone: acc.timezone,
          accountStatus: acc.accountStatus,
          businessId: acc.businessId,
          businessName: acc.businessName,
        },
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "CONNECTED_FACEBOOK_ADS",
        entityType: "SocialAccount",
        entityId: socialAccount.id,
        metadata: { adAccountsFound: adAccounts.length },
      },
    })

    return NextResponse.redirect(
      new URL(`/ads?connected=true&accounts=${adAccounts.length}`, req.nextUrl.origin)
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Facebook OAuth callback error:", message)
    return NextResponse.redirect(
      new URL(`/ads?error=${encodeURIComponent(message)}`, req.nextUrl.origin)
    )
  }
}
