import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"

const createEnvironmentSchema = z.object({
  name: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = createEnvironmentSchema.parse(json)

    // Récupérer l'ID de l'application active
    const cookieStore = await cookies()
    const activeApplicationId = cookieStore.get('activeApplicationId')?.value

    if (!activeApplicationId) {
      return NextResponse.json(
        { error: "Aucune application n'est sélectionnée" },
        { status: 400 }
      )
    }

    // Vérifier si l'application existe
    const application = await prisma.application.findUnique({
      where: { id: activeApplicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "L'application sélectionnée n'existe pas" },
        { status: 400 }
      )
    }

    const environment = await prisma.environment.create({
      data: {
        name: body.name,
        applicationId: activeApplicationId,
      },
    })

    return NextResponse.json(environment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 })
    }

    console.error('[CREATE_ENVIRONMENT]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'environnement" },
      { status: 500 }
    )
  }
} 