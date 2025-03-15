import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateEnvironmentSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validation = updateEnvironmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Vérifie si le nom est déjà utilisé par un autre environnement
    const existingEnvironment = await prisma.environment.findFirst({
      where: {
        name: validation.data.name,
        id: { not: params.id },
      },
    })

    if (existingEnvironment) {
      return NextResponse.json(
        { error: "Un environnement avec ce nom existe déjà" },
        { status: 400 }
      )
    }

    const environment = await prisma.environment.update({
      where: { id: params.id },
      data: validation.data,
    })

    return NextResponse.json(environment)
  } catch (error) {
    console.error('Erreur lors de la modification:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Supprime d'abord toutes les valeurs de variables associées
    await prisma.variableValue.deleteMany({
      where: {
        environmentId: params.id
      }
    })

    // Puis supprime l'environnement
    await prisma.environment.delete({
      where: {
        id: params.id
      }
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression" },
      { status: 500 }
    )
  }
} 