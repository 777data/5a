import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const apiSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise").url("L'URL n'est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json()
    const body = apiSchema.parse(json)

    // Vérifier si l'application existe
    const application = await prisma.application.findUnique({
      where: { id: params.id },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application introuvable" },
        { status: 404 }
      )
    }

    // Créer l'API
    const api = await prisma.api.create({
      data: {
        ...body,
        applicationId: params.id,
      },
    })

    return NextResponse.json(api)
  } catch (error) {
    console.error("Erreur lors de la création de l'API:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'API" },
      { status: 500 }
    )
  }
} 