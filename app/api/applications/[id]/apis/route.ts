import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const apiSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().min(1, "L'URL est requise").url("L'URL n'est pas valide"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  collectionId: z.string().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("applications") + 1];
    
    const json = await request.json();
    const body = apiSchema.parse(json);

    // Vérifier si l'application existe
    const application = await prisma.application.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application introuvable" },
        { status: 404 }
      )
    }

    // Si collectionId est fourni, vérifier si la collection existe et appartient à l'application
    if (body.collectionId) {
      const collection = await prisma.collection.findFirst({
        where: {
          id: body.collectionId,
          applicationId: id,
        },
      })

      if (!collection) {
        return NextResponse.json(
          { error: "Collection introuvable ou n'appartient pas à cette application" },
          { status: 404 }
        )
      }
    }

    // Créer l'API
    const api = await prisma.api.create({
      data: {
        name: body.name,
        url: body.url,
        method: body.method,
        headers: body.headers,
        body: body.body,
        applicationId: id,
        collectionId: body.collectionId || null,
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