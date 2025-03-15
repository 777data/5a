import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateAuthenticationSchema = z.object({
  name: z.string().min(1),
  token: z.string().min(1),
  apiKey: z.string().min(1),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string; authId: string } }
) {
  try {
    const json = await request.json()
    const body = updateAuthenticationSchema.parse(json)
    const { id: applicationId, authId } = params

    // Vérifier si l'authentification existe
    const existingAuth = await prisma.authentication.findUnique({
      where: {
        id: authId,
        applicationId: applicationId,
      },
    })

    if (!existingAuth) {
      return NextResponse.json(
        { error: "Authentification non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier si le nouveau nom est déjà utilisé
    if (body.name !== existingAuth.name) {
      const duplicateName = await prisma.authentication.findFirst({
        where: {
          name: body.name,
          id: { not: authId },
        },
      })

      if (duplicateName) {
        return NextResponse.json(
          { error: "Une authentification avec ce nom existe déjà" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour l'authentification
    const authentication = await prisma.authentication.update({
      where: {
        id: authId,
      },
      data: {
        name: body.name,
        token: body.token,
        apiKey: body.apiKey,
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

    console.error('[UPDATE_AUTHENTICATION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de l'authentification" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; authId: string } }
) {
  try {
    const { id: applicationId, authId } = params

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

    // Supprimer l'authentification
    await prisma.authentication.delete({
      where: {
        id: authId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE_AUTHENTICATION]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l'authentification" },
      { status: 500 }
    )
  }
} 