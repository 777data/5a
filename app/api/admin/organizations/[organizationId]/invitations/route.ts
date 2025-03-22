import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { email } = await request.json()

    // Vérifier si l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
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
        organizationId: params.organizationId,
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
        organizationId: params.organizationId,
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
        organizationId: params.organizationId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire dans 7 jours
      },
    })

    // Envoyer l'email d'invitation
    const { data, error } = await resend.emails.send({
      from: 'Agendize <no-reply@leonaar.com>',
      to: email,
      subject: `Invitation à rejoindre ${organization.name}`,
      html: `
        <h1>Vous avez été invité à rejoindre ${organization.name}</h1>
        <p>Cliquez sur le lien ci-dessous pour accepter l'invitation :</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/invitations/${token}">
          Accepter l'invitation
        </a>
        <p>Ce lien expirera dans 7 jours.</p>
      `,
    })

    if (error) {
      console.error('Erreur Resend:', error)
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Invitation envoyée avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
} 