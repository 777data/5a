import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateVariableValueSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string; variableId: string } }
) {
  try {
    const json = await request.json()
    const body = updateVariableValueSchema.parse(json)
    const { id: environmentId, variableId } = params

    // Vérifier si la valeur de variable existe
    const existingValue = await prisma.variableValue.findUnique({
      where: {
        id: variableId,
        environmentId: environmentId,
      },
    })

    if (!existingValue) {
      return NextResponse.json(
        { error: "Variable non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier si le nouveau nom est déjà utilisé par une autre variable dans le même environnement
    if (body.name !== existingValue.name) {
      const existingVariableWithSameName = await prisma.variableValue.findFirst({
        where: {
          name: body.name,
          environmentId: environmentId,
          id: { not: variableId },
        },
      })

      if (existingVariableWithSameName) {
        return NextResponse.json(
          { error: "Une variable avec ce nom existe déjà dans cet environnement" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour la valeur de variable
    const variableValue = await prisma.variableValue.update({
      where: {
        id: variableId,
      },
      data: {
        name: body.name,
        value: body.value,
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

    console.error('[UPDATE_VARIABLE_VALUE]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de la variable" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; variableId: string } }
) {
  try {
    const { id: environmentId, variableId } = params

    // Vérifier si la variable existe pour cet environnement
    const variableValue = await prisma.variableValue.findUnique({
      where: {
        id: variableId,
        environmentId: environmentId,
      },
    })

    if (!variableValue) {
      return NextResponse.json(
        { error: "Variable non trouvée" },
        { status: 404 }
      )
    }

    // Supprimer la variable
    await prisma.variableValue.delete({
      where: {
        id: variableId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE_VARIABLE]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de la variable" },
      { status: 500 }
    )
  }
} 