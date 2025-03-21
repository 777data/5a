import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import * as z from "zod"

const updateAuthenticationSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  type: z.enum(["API_KEY", "BEARER_TOKEN"]).optional(),
  apiKey: z.string().min(1, "La clé API est requise").nullish(),
  token: z.string().min(1, "Le token est requis").nullish(),
}).refine((data) => {
  // Si le type est spécifié, vérifier que le champ correspondant est présent
  if (data.type === "API_KEY" && data.apiKey === undefined) {
    return false
  }
  if (data.type === "BEARER_TOKEN" && data.token === undefined) {
    return false
  }
  return true
}, {
  message: "La clé API est requise pour le type API_KEY, et le token est requis pour le type BEARER_TOKEN"
})

export async function GET(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const applicationId = segments[segments.indexOf("applications") + 1];
    const authId = segments[segments.indexOf("authentications") + 2];

    // Vérifier si l'authentification existe
    const authentication = await prisma.authentication.findUnique({
      where: {
        id: authId,
        applicationId: applicationId,
      },
    })

    if (!authentication) {
      return NextResponse.json(
        { error: "Authentification non trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json(authentication)
  } catch (error) {
    console.error('[GET_AUTHENTICATION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de l'authentification" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const applicationId = segments[segments.indexOf("applications") + 1]
    const authId = segments[segments.indexOf("authentications") + 1]

    const json = await request.json()
    const body = updateAuthenticationSchema.parse(json)

    // Vérifier si l'authentification existe
    const existingAuth = await prisma.authentication.findUnique({
      where: {
        id: authId
      }
    })

    if (!existingAuth) {
      return NextResponse.json(
        { error: "Authentification non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'authentification appartient bien à l'application
    if (existingAuth.applicationId !== applicationId) {
      return NextResponse.json(
        { error: "Cette authentification n'appartient pas à cette application" },
        { status: 403 }
      )
    }

    // Mettre à jour l'authentification
    const updatedAuth = await prisma.authentication.update({
      where: {
        id: authId
      },
      data: body
    })

    return NextResponse.json(updatedAuth)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[AUTHENTICATIONS_PUT]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de l'authentification" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const applicationId = segments[segments.indexOf("applications") + 1]
    const authId = segments[segments.indexOf("authentications") + 1]

    // Vérifier si l'authentification existe
    const existingAuth = await prisma.authentication.findUnique({
      where: {
        id: authId
      }
    })

    if (!existingAuth) {
      return NextResponse.json(
        { error: "Authentification non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'authentification appartient bien à l'application
    if (existingAuth.applicationId !== applicationId) {
      return NextResponse.json(
        { error: "Cette authentification n'appartient pas à cette application" },
        { status: 403 }
      )
    }

    // Supprimer l'authentification
    await prisma.authentication.delete({
      where: {
        id: authId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[AUTHENTICATIONS_DELETE]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l'authentification" },
      { status: 500 }
    )
  }
} 