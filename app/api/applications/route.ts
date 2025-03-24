import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"
import { requireAuth } from "@/lib/auth"

const createApplicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  organizationId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const json = await request.json()
    const body = createApplicationSchema.parse(json)

    const application = await prisma.application.create({
      data: {
        ...body,
        ownerId: user.id,
      },
    })

    return NextResponse.json(application)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Non autorisé") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    console.error("[APPLICATIONS_POST]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'application" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await requireAuth();

    const applications = await prisma.application.findMany({
      where: {
        OR: [
          // Applications dont l'utilisateur est propriétaire
          { ownerId: user.id },
          // Applications des organisations dont l'utilisateur est membre
          {
            organization: {
              members: {
                some: {
                  userId: user.id
                }
              }
            }
          }
        ]
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            environments: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(applications)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Non autorisé") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    console.error("[APPLICATIONS_GET]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des applications" },
      { status: 500 }
    )
  }
} 