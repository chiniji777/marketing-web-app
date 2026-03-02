import { prisma } from "./prisma"

const modelsWithOrgId = [
  "campaign",
  "content",
  "contentTemplate",
  "socialAccount",
  "socialMention",
  "adsCampaign",
  "lead",
  "contact",
  "leadForm",
  "emailCampaign",
  "emailTemplate",
  "emailSubscriber",
  "keyword",
  "seoAudit",
  "report",
  "tag",
  "activityLog",
  "notification",
  "comment",
] as const

// Cache extended clients per organizationId to avoid re-creating extensions on every call
const tenantCache = new Map<string, ReturnType<typeof createTenantClient>>()

function createTenantClient(organizationId: string) {
  // Reuse the global prisma client (shared connection pool) and only add org-filtering extension
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model) return query(args)

        const modelName = model.charAt(0).toLowerCase() + model.slice(1)
        const isOrgModel = modelsWithOrgId.includes(
          modelName as (typeof modelsWithOrgId)[number]
        )

        if (!isOrgModel) return query(args)

        if (
          operation === "findMany" ||
          operation === "findFirst" ||
          operation === "findUnique" ||
          operation === "count" ||
          operation === "aggregate" ||
          operation === "groupBy"
        ) {
          const where = (args as Record<string, unknown>).where ?? {}
          ;(args as Record<string, unknown>).where = {
            ...where,
            organizationId,
          }
        }

        if (operation === "create") {
          const data =
            ((args as Record<string, unknown>).data as Record<string, unknown>) ?? {}
          ;(args as Record<string, unknown>).data = {
            ...data,
            organizationId,
          }
        }

        if (operation === "createMany") {
          const data = (args as Record<string, unknown>).data
          if (Array.isArray(data)) {
            ;(args as Record<string, unknown>).data = data.map((item) => ({
              ...(item as Record<string, unknown>),
              organizationId,
            }))
          }
        }

        if (operation === "update" || operation === "updateMany") {
          const where = (args as Record<string, unknown>).where ?? {}
          ;(args as Record<string, unknown>).where = {
            ...where,
            organizationId,
          }
        }

        if (operation === "delete" || operation === "deleteMany") {
          const where = (args as Record<string, unknown>).where ?? {}
          ;(args as Record<string, unknown>).where = {
            ...where,
            organizationId,
          }
        }

        if (operation === "upsert") {
          const where = (args as Record<string, unknown>).where ?? {}
          ;(args as Record<string, unknown>).where = {
            ...where,
            organizationId,
          }
          const create =
            ((args as Record<string, unknown>).create as Record<string, unknown>) ?? {}
          ;(args as Record<string, unknown>).create = {
            ...create,
            organizationId,
          }
        }

        return query(args)
      },
    },
  })
}

export function getTenantPrisma(organizationId: string) {
  let client = tenantCache.get(organizationId)
  if (!client) {
    client = createTenantClient(organizationId)
    tenantCache.set(organizationId, client)
  }
  return client
}
