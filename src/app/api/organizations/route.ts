import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { joinedAt: "desc" },
  })

  const orgs = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }))

  return NextResponse.json(orgs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createOrgSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: `${slug}-${Date.now().toString(36)}`,
      industry: parsed.data.industry,
      memberships: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  })

  return NextResponse.json(org, { status: 201 })
}
