import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).optional(),
  applicationId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = createCollectionSchema.parse(json)

    const collection = await prisma.collection.create({
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        applicationId: body.applicationId,
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

    console.error('[CREATE_COLLECTION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la collection" },
      { status: 500 }
    )
  }
} 