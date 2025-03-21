import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import * as z from "zod"

const updateCollectionSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "La couleur doit être au format hexadécimal").optional(),
})

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.indexOf("collections") + 1]
    
    const json = await request.json()
    const body = updateCollectionSchema.parse(json)

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
      },
    })

    return NextResponse.json(collection)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error('[UPDATE_COLLECTION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de la collection" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.indexOf("collections") + 1]
    
    // Utiliser une transaction pour supprimer la collection et ses APIs
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les résultats de tests d'API liés aux APIs de cette collection
      await tx.apiTestResult.deleteMany({
        where: {
          api: {
            collectionId: id
          }
        }
      })

      // 2. Supprimer les APIs de la collection
      await tx.api.deleteMany({
        where: {
          collectionId: id
        }
      })

      // 3. Supprimer la collection elle-même
      await tx.collection.delete({
        where: { id }
      })
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE_COLLECTION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de la collection" },
      { status: 500 }
    )
  }
} 