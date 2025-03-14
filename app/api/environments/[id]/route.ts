import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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