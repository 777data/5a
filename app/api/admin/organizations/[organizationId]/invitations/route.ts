import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { randomUUID } from 'crypto'
import { sendInvitationEmail } from '@/lib/send-invitation-email'

import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url)
    const segments = url.pathname.split('/')
    const organizationId = segments[segments.indexOf("organizations") + 1]

    const { email } = await request.json()

    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }
    
    // Vérifier si l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "L'organisation n'existe pas" },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: {
          email,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "Cet utilisateur est déjà membre de l'organisation" },
        { status: 400 }
      )
    }

    // Vérifier s'il existe déjà une invitation en attente
    const existingInvitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId,
        email,
        expiresAt: {
          gt: new Date(), // invitation non expirée
        },
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Une invitation a déjà été envoyée à cet email" },
        { status: 400 }
      )
    }

    // Générer un token unique pour l'invitation
    const token = randomUUID()

    // Créer l'invitation dans la base de données
    await prisma.organizationInvitation.create({
      data: {
        email,
        token,
        organizationId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire dans 7 jours
      },
    })

    // Envoyer l'email d'invitation
    try {
      await sendInvitationEmail({
        email,
        organizationName: organization.name,
        token,
      })

      return NextResponse.json(
        { message: "Invitation envoyée avec succès" },
        { status: 200 }
      )
    } catch {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
} 