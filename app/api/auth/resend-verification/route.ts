import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email-verification"
import { z } from "zod"

const resendSchema = z.object({
  email: z.string().email("Email invalide"),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = resendSchema.parse(json)

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "L'email est déjà vérifié" },
        { status: 400 }
      )
    }

    const verificationToken = generateVerificationToken(body.email)
    await sendVerificationEmail(body.email, verificationToken)

    return NextResponse.json({
      message: "Un nouvel email de vérification a été envoyé"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      )
    }

    console.error("[RESEND_VERIFICATION_ERROR]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi de l'email" },
      { status: 500 }
    )
  }
} 