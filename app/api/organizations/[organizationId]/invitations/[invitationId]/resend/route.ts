import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/send-invitation-email'

export async function POST(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const organizationId = segments[segments.indexOf("organizations") + 1]
    const invitationId = segments[segments.indexOf("invitations") + 1]

    // Vérifier si l'invitation existe et n'est pas expirée
    const invitation = await prisma.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: true,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "L'invitation n'existe pas ou a expiré" },
        { status: 404 }
      )
    }

    // Envoyer l'email d'invitation
    try {
      await sendInvitationEmail({
        email: invitation.email,
        organizationName: invitation.organization.name,
        token: invitation.token,
      })

      return NextResponse.json(
        { message: "Invitation renvoyée avec succès" },
        { status: 200 }
      )
    } catch {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erreur lors du renvoi de l\'invitation:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors du renvoi de l'invitation" },
      { status: 500 }
    )
  }
} 