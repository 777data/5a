import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import * as z from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createOrganizationSchema = z.object({
  name: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const json = await request.json()
    const body = createOrganizationSchema.parse(json)

    const organization = await prisma.organization.create({
      data: {
        name: body.name,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    console.error("[ORGANIZATION_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 