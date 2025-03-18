import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const collectionId = segments[segments.indexOf("collections") + 1];
    
    const { apis } = await request.json()

    // Vérifier que la collection existe
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    })

    if (!collection) {
      return NextResponse.json(
        { error: "Collection non trouvée" },
        { status: 404 }
      )
    }

    // Mettre à jour l'ordre des APIs
    const updatePromises = apis.map(({ id, order }: { id: string; order: number }) => {
      return prisma.api.update({
        where: { id },
        data: { order },
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la réorganisation des APIs:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réorganisation des APIs" },
      { status: 500 }
    )
  }
} 