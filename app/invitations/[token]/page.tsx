import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvitationValidator } from "./invitation-validator"

interface InvitationPageProps {
  params: {
    token: string
  }
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const session = await getServerSession(authOptions)
  
  // Vérifier si l'invitation existe
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token: params.token },
    include: {
      organization: true
    }
  })

  if (!invitation) {
    return <InvitationValidator error="invalid" />
  }

  // Vérifier si l'invitation n'est pas expirée
  if (invitation.expiresAt < new Date()) {
    return <InvitationValidator error="expired" />
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!session) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/invitations/${params.token}`)}`)
  }

  // Vérifier si l'email de l'invitation correspond à l'utilisateur connecté
  if (session.user.email !== invitation.email) {
    return <InvitationValidator error="email_mismatch" />
  }

  try {
    // Créer le membre de l'organisation
    await prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: 'MEMBER'
      }
    })

    // Supprimer l'invitation
    await prisma.organizationInvitation.delete({
      where: { id: invitation.id }
    })

    return <InvitationValidator success organization={invitation.organization.name} />
  } catch (error) {
    console.error('Erreur lors de la validation de l\'invitation:', error)
    return <InvitationValidator error="process" />
  }
} 