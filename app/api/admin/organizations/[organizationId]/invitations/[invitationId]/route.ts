import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { prisma } from '@/lib/prisma'

import { authOptions } from "@/lib/auth"

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const organizationId = segments[segments.indexOf("organizations") + 1]
    const invitationId = segments[segments.indexOf("invitations") + 1]

    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }
    
    // Vérifier si l'invitation existe
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "L'invitation n'existe pas" },
        { status: 404 }
      )
    }

    // Supprimer l'invitation
    await prisma.organizationInvitation.delete({
      where: {
        id: invitationId,
      },
    })

    return NextResponse.json(
      { message: "Invitation annulée avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'invitation:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'annulation de l'invitation" },
      { status: 500 }
    )
  }
} 