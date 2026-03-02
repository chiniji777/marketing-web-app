/**
 * Serializes Prisma query results for safe passage to Client Components.
 * Converts Prisma Decimal objects (decimal.js) to plain numbers and
 * BigInt values to numbers so they can be serialized as JSON.
 */
export function serializePrisma<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      // Convert BigInt to number
      if (typeof value === "bigint") return Number(value)
      // Convert Prisma Decimal (decimal.js) — identified by s/e/d properties
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        "s" in value &&
        "e" in value &&
        "d" in value
      ) {
        return Number(String(value))
      }
      return value
    })
  )
}
