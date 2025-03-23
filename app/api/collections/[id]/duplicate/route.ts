import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

export async function POST(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("collections") + 1];
    
    // Récupérer la collection originale avec ses APIs
    const originalCollection = await prisma.collection.findUnique({
      where: { id },
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
      for (const api of originalCollection.apis) {
        await prisma.api.create({
          data: {
            name: api.name,
            url: api.url,
            method: api.method,
            headers: api.headers as Prisma.InputJsonValue,
            body: api.body as Prisma.InputJsonValue,
            order: api.order,
            collectionId: newCollection.id,
          },
        });
      }
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