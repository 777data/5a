import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInvitationEmailParams {
  email: string
  organizationName: string
  token: string
}

export async function sendInvitationEmail({
  email,
  organizationName,
  token,
}: SendInvitationEmailParams) {
  const { error } = await resend.emails.send({
    from: 'Agendize <no-reply@leonaar.com>',
    to: email,
    subject: `Invitation à rejoindre ${organizationName}`,
    html: `
      <h1>Vous avez été invité à rejoindre ${organizationName}</h1>
      <p>Cliquez sur le lien ci-dessous pour accepter l'invitation :</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/invitations/${token}">
        Accepter l'invitation
      </a>
      <p>Ce lien expirera dans 7 jours.</p>
    `,
  })

  if (error) {
    console.error('Erreur Resend:', error)
    throw new Error("Erreur lors de l'envoi de l'email")
  }
} 