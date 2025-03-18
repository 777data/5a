import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateEnvironmentSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
})

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("environments") + 1];
    
    const body = await request.json()
    const validation = updateEnvironmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const environment = await prisma.environment.update({
      where: { id },
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

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("environments") + 1];
    
    // Supprime d'abord toutes les valeurs de variables associées
    await prisma.variableValue.deleteMany({
      where: {
        environmentId: id
      }
    })

    // Puis supprime l'environnement
    await prisma.environment.delete({
      where: {
        id
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