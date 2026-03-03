import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getConnectionString(): string {
  // Prefer direct TCP connection URL if provided
  const directUrl = process.env.DIRECT_DATABASE_URL
  if (directUrl) return directUrl

  // Fall back to DATABASE_URL — if it's a prisma+postgres:// URL, extract the TCP URL from the API key
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    // Extract the actual postgres TCP URL from the base64-encoded API key
    try {
      const url = new URL(databaseUrl.replace("prisma+postgres://", "http://"))
      const apiKey = url.searchParams.get("api_key")
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString())
        if (decoded.databaseUrl) return decoded.databaseUrl
      }
    } catch {
      // Fall through to use the URL as-is
    }
  }

  return databaseUrl
}

function createPrismaClient() {
  const connectionString = getConnectionString()
  const adapter = new PrismaPg({ connectionString, max: 20 })
  return new PrismaClient({ adapter })
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Lazy proxy — defers PrismaClient creation until first property access at runtime.
// This prevents "DATABASE_URL is not set" crash during Next.js build phase.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getClient()
    const value = Reflect.get(client, prop)
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }
    return value
  },
})
