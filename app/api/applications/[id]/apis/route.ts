import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const createApiSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise").url("L'URL n'est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  collectionId: z.string().min(1, "La collection est requise"),
})

export async function POST(request: Request) {
  try {
    // Extraire l'ID de l'application de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const applicationId = segments[segments.indexOf("applications") + 1]

    const json = await request.json()
    const body = createApiSchema.parse(json)

    // Vérifier que la collection existe et appartient à l'application
    const collection = await prisma.collection.findUnique({
      where: {
        id: body.collectionId,
      }
    })

    if (!collection) {
      return NextResponse.json(
        { error: "Collection non trouvée" },
        { status: 404 }
      )
    }

    if (collection.applicationId !== applicationId) {
      return NextResponse.json(
        { error: "Cette collection n'appartient pas à cette application" },
        { status: 403 }
      )
    }

    // Créer l'API
    const api = await prisma.collection.update({
      where: {
        id: body.collectionId
      },
      data: {
        apis: {
          create: {
            name: body.name,
            url: body.url,
            method: body.method,
            headers: body.headers || {},
            body: body.body
          }
        }
      },
      include: {
        apis: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    // Retourner la dernière API créée
    return NextResponse.json(api.apis[0])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[APIS_POST]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'API" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Extraire l'ID de l'application de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const applicationId = segments[segments.indexOf("applications") + 1]

    // Récupérer toutes les APIs de l'application via les collections
    const apis = await prisma.api.findMany({
      where: {
        collection: {
          applicationId: applicationId
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(apis)
  } catch (error) {
    console.error("[APIS_GET]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des APIs" },
      { status: 500 }
    )
  }
} 