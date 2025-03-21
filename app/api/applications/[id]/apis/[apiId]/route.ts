import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const apiSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise").url("L'URL n'est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  collectionId: z.string().min(1, "La collection est requise"),
})

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const applicationId = segments[segments.indexOf("applications") + 1]
    const apiId = segments[segments.indexOf("apis") + 1]

    const json = await request.json()
    const body = apiSchema.parse(json)

    // Vérifier si l'API existe et appartient à l'application via sa collection
    const api = await prisma.api.findUnique({
      where: {
        id: apiId
      },
      include: {
        collection: true
      }
    })

    if (!api) {
      return NextResponse.json(
        { error: "API introuvable" },
        { status: 404 }
      )
    }

    if (api.collection.applicationId !== applicationId) {
      return NextResponse.json(
        { error: "Cette API n'appartient pas à cette application" },
        { status: 403 }
      )
    }

    // Vérifier que la nouvelle collection appartient à l'application
    const collection = await prisma.collection.findUnique({
      where: {
        id: body.collectionId
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: "Collection introuvable" },
        { status: 404 }
      )
    }

    if (collection.applicationId !== applicationId) {
      return NextResponse.json(
        { error: "Cette collection n'appartient pas à cette application" },
        { status: 403 }
      )
    }

    // Mettre à jour l'API
    const updatedApi = await prisma.api.update({
      where: {
        id: apiId
      },
      data: {
        name: body.name,
        url: body.url,
        method: body.method,
        headers: body.headers || {},
        body: body.body,
        collectionId: body.collectionId
      }
    })

    return NextResponse.json(updatedApi)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[APIS_PUT]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de l'API" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const applicationId = segments[segments.indexOf("applications") + 1]
    const apiId = segments[segments.indexOf("apis") + 1]
    
    // Vérifier si l'API existe et appartient à l'application via sa collection
    const api = await prisma.api.findUnique({
      where: {
        id: apiId
      },
      include: {
        collection: true
      }
    })

    if (!api) {
      return NextResponse.json(
        { error: "API introuvable" },
        { status: 404 }
      )
    }

    if (api.collection.applicationId !== applicationId) {
      return NextResponse.json(
        { error: "Cette API n'appartient pas à cette application" },
        { status: 403 }
      )
    }

    // Supprimer d'abord tous les résultats de test associés à cette API
    await prisma.apiTestResult.deleteMany({
      where: {
        apiId
      }
    })

    // Supprimer l'API
    await prisma.api.delete({
      where: {
        id: apiId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[APIS_DELETE]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l'API" },
      { status: 500 }
    )
  }
} 