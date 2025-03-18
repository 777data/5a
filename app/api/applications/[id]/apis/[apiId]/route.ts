import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const apiSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L&apos;URL est requise").url("L&apos;URL n&apos;est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  collectionId: z.string().nullable().optional(),
})

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("applications") + 1];
    const apiId = segments[segments.indexOf("apis") + 2];
    
    const json = await request.json()
    const body = apiSchema.parse(json)

    // Vérifier si l'API existe et appartient à l'application
    const api = await prisma.application.findFirst({
      where: {
        id,
        apis: {
          some: {
            id: apiId
          }
        }
      },
      select: {
        apis: {
          where: {
            id: apiId
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

    // Si collectionId est fourni, vérifier si la collection existe et appartient à l'application
    if (body.collectionId) {
      const collection = await prisma.collection.findFirst({
        where: {
          id: body.collectionId,
          applicationId: id,
        },
      })

      if (!collection) {
        return NextResponse.json(
          { error: "Collection introuvable ou n&apos;appartient pas à cette application" },
          { status: 404 }
        )
      }
    }

    // Mettre à jour l'API
    const updatedApi = await prisma.api.update({
      where: {
        id: apiId,
      },
      data: {
        name: body.name,
        url: body.url,
        method: body.method,
        headers: body.headers,
        body: body.body,
        collectionId: body.collectionId,
      },
    })

    return NextResponse.json(updatedApi)
  } catch (error) {
    console.error("Erreur lors de la modification de l&apos;API:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de l&apos;API" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("applications") + 1];
    const apiId = segments[segments.indexOf("apis") + 2];
    
    // Vérifier si l'API existe et appartient à l'application
    const api = await prisma.application.findFirst({
      where: {
        id,
        apis: {
          some: {
            id: apiId
          }
        }
      },
      select: {
        apis: {
          where: {
            id: apiId
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

    // Supprimer d'abord tous les résultats de test associés à cette API
    await prisma.apiTestResult.deleteMany({
      where: {
        apiId,
      },
    })

    // Supprimer l'API
    await prisma.api.delete({
      where: {
        id: apiId,
      },
    })

    return NextResponse.json({ message: "API supprimée avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression de l&apos;API:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l&apos;API" },
      { status: 500 }
    )
  }
} 