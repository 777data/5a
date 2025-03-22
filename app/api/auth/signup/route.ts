import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email-verification"

const signupSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = signupSchema.parse(json)

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        emailVerified: null, // L'email n'est pas encore vérifié
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Générer et envoyer le token de vérification
    const verificationToken = generateVerificationToken(body.email);
    await sendVerificationEmail(body.email, verificationToken);

    return NextResponse.json({
      ...user,
      message: "Un email de vérification a été envoyé à votre adresse email."
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[SIGNUP_ERROR]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    )
  }
} 