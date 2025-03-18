import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createAuthenticationSchema = z.object({
  name: z.string().min(1),
  token: z.string().min(1),
  apiKey: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const applicationId = segments[segments.indexOf("applications") + 1];
    
    const json = await request.json()
    const body = createAuthenticationSchema.parse(json)

    // Vérifier si l'application existe
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier si une authentification avec ce nom existe déjà
    const existingAuth = await prisma.authentication.findFirst({
      where: { name: body.name },
    })

    if (existingAuth) {
      return NextResponse.json(
        { error: "Une authentification avec ce nom existe déjà" },
        { status: 400 }
      )
    }

    // Créer l'authentification
    const authentication = await prisma.authentication.create({
      data: {
        name: body.name,
        token: body.token,
        apiKey: body.apiKey,
        applicationId: applicationId,
      },
    })

    return NextResponse.json(authentication)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.flatten() },
        { status: 400 }
      )
    }

    console.error('[CREATE_AUTHENTICATION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de l'authentification" },
      { status: 500 }
    )
  }
} 