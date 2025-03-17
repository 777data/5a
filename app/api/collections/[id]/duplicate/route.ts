import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer la collection originale avec ses APIs
    const originalCollection = await prisma.collection.findUnique({
      where: { id: params.id },
      include: {
        apis: true,
      },
    })

    if (!originalCollection) {
      return NextResponse.json(
        { error: "Collection non trouvée" },
        { status: 404 }
      )
    }

    // Créer une nouvelle collection avec les mêmes propriétés
    const newCollection = await prisma.collection.create({
      data: {
        name: `Copie de ${originalCollection.name}`,
        description: originalCollection.description,
        color: originalCollection.color,
        applicationId: originalCollection.applicationId,
      },
    })

    // Dupliquer toutes les APIs de la collection originale
    if (originalCollection.apis.length > 0) {
      await prisma.api.createMany({
        data: originalCollection.apis.map(api => ({
          name: api.name,
          url: api.url,
          method: api.method,
          headers: api.headers,
          body: api.body,
          order: api.order,
          applicationId: api.applicationId,
          collectionId: newCollection.id,
        })),
      })
    }

    return NextResponse.json(newCollection)
  } catch (error) {
    console.error('[DUPLICATE_COLLECTION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la duplication de la collection" },
      { status: 500 }
    )
  }
} 