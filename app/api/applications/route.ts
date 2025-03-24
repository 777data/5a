import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const createApplicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  organizationId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const json = await request.json()
    const body = createApplicationSchema.parse(json)

    const { organizationId, ...applicationData } = body

    const application = await prisma.application.create({
      data: {
        ...applicationData,
        owner: {
          connect: {
            id: session.user.id
          }
        },
        ...(organizationId && {
          organization: {
            connect: {
              id: organizationId
            }
          }
        })
      },
    })

    return NextResponse.json(application)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
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
    const applications = await prisma.application.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            environments: true,
          },
        },
      },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error("[APPLICATIONS_GET]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des applications" },
      { status: 500 }
    )
  }
} 