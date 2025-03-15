import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const createApplicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = createApplicationSchema.parse(json)

    const application = await prisma.application.create({
      data: body,
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