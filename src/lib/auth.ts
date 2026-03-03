import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "./prisma"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user?.hashedPassword) return null

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.hashedPassword
        )

        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isSuperAdmin: true },
        })
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false

        const membership = await prisma.membership.findFirst({
          where: { userId: user.id, isActive: true },
          include: { organization: { select: { id: true, name: true, slug: true } } },
          orderBy: { joinedAt: "desc" },
        })

        if (membership) {
          token.activeOrganizationId = membership.organizationId
          token.activeOrganizationName = membership.organization.name
          token.activeOrganizationSlug = membership.organization.slug
          token.activeRole = membership.role
        }
      }

      if (trigger === "update" && session?.activeOrganizationId) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: token.id as string,
              organizationId: session.activeOrganizationId as string,
            },
          },
          include: { organization: { select: { id: true, name: true, slug: true } } },
        })

        if (membership && membership.isActive) {
          token.activeOrganizationId = membership.organizationId
          token.activeOrganizationName = membership.organization.name
          token.activeOrganizationSlug = membership.organization.slug
          token.activeRole = membership.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
        session.user.activeOrganizationId = token.activeOrganizationId as string
        session.user.activeOrganizationName = token.activeOrganizationName as string
        session.user.activeOrganizationSlug = token.activeOrganizationSlug as string
        session.user.activeRole = token.activeRole as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-create a personal organization for new users
      if (!user.id || !user.email) return

      const slug = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-")
      const orgName = user.name ? `${user.name}'s Workspace` : "My Workspace"

      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: `${slug}-${Date.now().toString(36)}`,
        },
      })

      await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "ADMIN",
        },
      })
    },
  },
})
