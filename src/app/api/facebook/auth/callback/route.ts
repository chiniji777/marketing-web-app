import { prisma } from "@/lib/prisma"
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getFacebookUser,
  getAdAccounts,
  getPages,
} from "@/lib/facebook"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const stateParam = searchParams.get("state")
  const error = searchParams.get("error")

  // Decode state first to get returnTo
  let stateData: { organizationId: string; userId: string; returnTo?: string }
  try {
    stateData = stateParam
      ? JSON.parse(Buffer.from(stateParam, "base64url").toString())
      : { organizationId: "", userId: "" }
  } catch {
    stateData = { organizationId: "", userId: "" }
  }

  const returnTo = stateData.returnTo || "/ads"

  if (error) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(error)}`, req.nextUrl.origin)
    )
  }

  if (!code || !stateParam || !stateData.organizationId) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=missing_params`, req.nextUrl.origin)
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
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    // Get Facebook user info
    const fbUser = await getFacebookUser(accessToken)

    // Get ad accounts
    const adAccounts = await getAdAccounts(accessToken)

    // Get Facebook Pages (for publishing + Instagram detection)
    let pages: Array<{ id: string; name: string; accessToken: string }> = []
    try {
      pages = await getPages(accessToken)
    } catch {
      // Pages access may not be available — non-fatal
    }

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
        tokenExpiresAt,
        accountName: fbUser.name,
        isActive: true,
        metadata: {
          email: fbUser.email,
          adAccountCount: adAccounts.length,
          pages: pages.map((p) => ({ id: p.id, name: p.name })),
          pageId: pages[0]?.id || null,
        },
      },
      create: {
        organizationId,
        platform: "FACEBOOK",
        platformAccountId: fbUser.id,
        accountName: fbUser.name,
        accessToken,
        tokenExpiresAt,
        metadata: {
          email: fbUser.email,
          adAccountCount: adAccounts.length,
          pages: pages.map((p) => ({ id: p.id, name: p.name })),
          pageId: pages[0]?.id || null,
        },
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

    // Auto-detect Instagram Business accounts linked to Facebook Pages
    let igAccountsFound = 0
    for (const page of pages) {
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v24.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${page.accessToken}`
        )
        if (igRes.ok) {
          const igData = await igRes.json()
          const igAccount = igData.instagram_business_account
          if (igAccount) {
            await prisma.socialAccount.upsert({
              where: {
                organizationId_platform_platformAccountId: {
                  organizationId,
                  platform: "INSTAGRAM",
                  platformAccountId: igAccount.id,
                },
              },
              update: {
                accessToken, // Uses same Facebook user token
                tokenExpiresAt,
                accountName: igAccount.username || igAccount.name || `IG - ${page.name}`,
                isActive: true,
                metadata: {
                  igUserId: igAccount.id,
                  username: igAccount.username,
                  profilePicture: igAccount.profile_picture_url,
                  linkedFacebookPageId: page.id,
                  linkedFacebookPageName: page.name,
                },
              },
              create: {
                organizationId,
                platform: "INSTAGRAM",
                platformAccountId: igAccount.id,
                accountName: igAccount.username || igAccount.name || `IG - ${page.name}`,
                accessToken,
                tokenExpiresAt,
                metadata: {
                  igUserId: igAccount.id,
                  username: igAccount.username,
                  profilePicture: igAccount.profile_picture_url,
                  linkedFacebookPageId: page.id,
                  linkedFacebookPageName: page.name,
                },
              },
            })
            igAccountsFound++
          }
        }
      } catch {
        // Instagram detection for this page failed — non-fatal
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "CONNECTED_FACEBOOK",
        entityType: "SocialAccount",
        entityId: socialAccount.id,
        metadata: {
          adAccountsFound: adAccounts.length,
          pagesFound: pages.length,
          igAccountsFound,
        },
      },
    })

    const params = new URLSearchParams({
      connected: "facebook",
      accounts: String(adAccounts.length),
      pages: String(pages.length),
    })
    if (igAccountsFound > 0) {
      params.set("instagram", String(igAccountsFound))
    }

    return NextResponse.redirect(
      new URL(`${returnTo}?${params.toString()}`, req.nextUrl.origin)
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Facebook OAuth callback error:", message)
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(message)}`, req.nextUrl.origin)
    )
  }
}
