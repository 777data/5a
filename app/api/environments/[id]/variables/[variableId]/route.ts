import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const updateVariableSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  value: z.string().min(1, "La valeur est requise"),
})

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const environmentId = segments[segments.indexOf("environments") + 1]
    const variableId = segments[segments.indexOf("variables") + 1]

    const json = await request.json()
    const body = updateVariableSchema.parse(json)

    // Vérifier si la valeur de variable existe
    const existingValue = await prisma.variableValue.findUnique({
      where: {
        id: variableId
      }
    })

    if (!existingValue) {
      return NextResponse.json(
        { error: "Variable non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que la variable appartient bien à l'environnement
    if (existingValue.environmentId !== environmentId) {
      return NextResponse.json(
        { error: "Cette variable n'appartient pas à cet environnement" },
        { status: 403 }
      )
    }

    // Mettre à jour la valeur de la variable
    const updatedValue = await prisma.variableValue.update({
      where: {
        id: variableId
      },
      data: body
    })

    return NextResponse.json(updatedValue)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[VARIABLES_PUT]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de la variable" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const environmentId = segments[segments.indexOf("environments") + 1]
    const variableId = segments[segments.indexOf("variables") + 1]

    // Vérifier si la valeur de variable existe
    const existingValue = await prisma.variableValue.findUnique({
      where: {
        id: variableId
      }
    })

    if (!existingValue) {
      return NextResponse.json(
        { error: "Variable non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que la variable appartient bien à l'environnement
    if (existingValue.environmentId !== environmentId) {
      return NextResponse.json(
        { error: "Cette variable n'appartient pas à cet environnement" },
        { status: 403 }
      )
    }

    // Supprimer la valeur de la variable
    await prisma.variableValue.delete({
      where: {
        id: variableId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[VARIABLES_DELETE]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de la variable" },
      { status: 500 }
    )
  }
} 