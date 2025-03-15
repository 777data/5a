import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id

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