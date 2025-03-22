import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/email-verification"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      )
    }

    const verification = verifyToken(token)

    if (!verification) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 400 }
      )
    }

    if (verification.expired) {
      return NextResponse.json(
        { error: "Le lien de vérification a expiré" },
        { status: 400 }
      )
    }

    // Mettre à jour l'utilisateur
    const user = await prisma.user.update({
      where: { email: verification.email },
      data: { emailVerified: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    })

    return NextResponse.json({
      message: "Email vérifié avec succès",
      user,
    })
  } catch (error) {
    console.error("[EMAIL_VERIFICATION_ERROR]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification de l'email" },
      { status: 500 }
    )
  }
} 