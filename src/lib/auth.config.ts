import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        // Edge-safe: return a placeholder user so JWT session is recognized.
        // Actual password validation + user lookup happens in auth.ts (Node.js runtime).
        // The middleware only needs to verify the JWT token, not re-run authorize.
        return { id: "placeholder" }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
} satisfies NextAuthConfig
