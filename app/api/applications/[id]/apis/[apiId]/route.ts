import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const apiSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise").url("L'URL n'est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string; apiId: string } }
) {
  try {
    const json = await request.json()
    const body = apiSchema.parse(json)

    // Vérifier si l'API existe et appartient à l'application
    const api = await prisma.application.findFirst({
      where: {
        id: params.id,
        apis: {
          some: {
            id: params.apiId
          }
        }
      },
      select: {
        apis: {
          where: {
            id: params.apiId
          }
        }
      }
    })

    if (!api || api.apis.length === 0) {
      return NextResponse.json(
        { error: "API introuvable" },
        { status: 404 }
      )
    }

    // Mettre à jour l'API
    const updatedApi = await prisma.api.update({
      where: {
        id: params.apiId,
      },
      data: body,
    })

    return NextResponse.json(updatedApi)
  } catch (error) {
    console.error("Erreur lors de la modification de l'API:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de l'API" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; apiId: string } }
) {
  try {
    // Vérifier si l'API existe et appartient à l'application
    const api = await prisma.application.findFirst({
      where: {
        id: params.id,
        apis: {
          some: {
            id: params.apiId
          }
        }
      },
      select: {
        apis: {
          where: {
            id: params.apiId
          }
        }
      }
    })

    if (!api || api.apis.length === 0) {
      return NextResponse.json(
        { error: "API introuvable" },
        { status: 404 }
      )
    }

    // Supprimer l'API
    await prisma.api.delete({
      where: {
        id: params.apiId,
      },
    })

    return NextResponse.json({ message: "API supprimée avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'API:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l'API" },
      { status: 500 }
    )
  }
} 