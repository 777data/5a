import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import * as z from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateOrganizationSchema = z.object({
  name: z.string().min(1),
})

export async function DELETE(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const organization = await prisma.organization.delete({
      where: {
        id: params.organizationId,
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error("[ORGANIZATION_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const json = await request.json()
    const body = updateOrganizationSchema.parse(json)

    const organization = await prisma.organization.update({
      where: {
        id: params.organizationId,
      },
      data: {
        name: body.name,
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    console.error("[ORGANIZATION_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 