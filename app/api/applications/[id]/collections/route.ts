import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const applicationId = segments[segments.indexOf("applications") + 1];

    const collections = await prisma.collection.findMany({
      where: { applicationId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
      },
    })

    return NextResponse.json(collections)
  } catch (error) {
    console.error('[GET_COLLECTIONS]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des collections" },
      { status: 500 }
    )
  }
} 