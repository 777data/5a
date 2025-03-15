import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createVariableValueSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json()
    const body = createVariableValueSchema.parse(json)
    const environmentId = params.id

    // Vérifier si l'environnement existe
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
    })

    if (!environment) {
      return NextResponse.json(
        { error: "Environnement non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si la variable existe déjà
    let variable = await prisma.variable.findFirst({
      where: { name: body.name },
    })

    // Si la variable n'existe pas, la créer
    if (!variable) {
      variable = await prisma.variable.create({
        data: { name: body.name },
      })
    }

    // Vérifier si une valeur existe déjà pour cette variable dans cet environnement
    const existingValue = await prisma.variableValue.findUnique({
      where: {
        variableId_environmentId: {
          variableId: variable.id,
          environmentId: environmentId,
        },
      },
    })

    if (existingValue) {
      return NextResponse.json(
        { error: "Cette variable existe déjà dans cet environnement" },
        { status: 400 }
      )
    }

    // Créer la valeur de la variable
    const variableValue = await prisma.variableValue.create({
      data: {
        value: body.value,
        variableId: variable.id,
        environmentId: environmentId,
      },
      include: {
        variable: true,
      },
    })

    return NextResponse.json(variableValue)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.flatten() },
        { status: 400 }
      )
    }

    console.error('[CREATE_VARIABLE_VALUE]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la variable" },
      { status: 500 }
    )
  }
} 