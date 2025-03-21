import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import * as z from "zod"

const createCollectionSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "La couleur doit être au format hexadécimal").optional(),
  applicationId: z.string().min(1, "L'ID de l'application est requis"),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = createCollectionSchema.parse(json)

    // Vérifier que l'application existe
    const application = await prisma.application.findUnique({
      where: {
        id: body.applicationId
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application non trouvée" },
        { status: 404 }
      )
    }

    // Créer la collection
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
        { error: "Données invalides", issues: error.issues },
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