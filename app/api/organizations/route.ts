import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(organizations)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Non autorisé") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    console.error("[ORGANIZATIONS_GET]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des organisations" },
      { status: 500 }
    )
  }
} 