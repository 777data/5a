import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional(),
})

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("collections") + 1];
    
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
        { error: "Données invalides", details: error.flatten() },
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
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("collections") + 1];
    
    // Mettre à jour les APIs associées pour les dissocier de la collection
    await prisma.api.updateMany({
      where: { collectionId: id },
      data: { collectionId: null },
    })

    // Supprimer la collection
    await prisma.collection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE_COLLECTION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de la collection" },
      { status: 500 }
    )
  }
} 