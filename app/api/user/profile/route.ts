import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const profileSchema = z.object({
  name: z.string().min(2),
})

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const json = await request.json()
    const body = profileSchema.parse(json)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.name },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Données invalides", { status: 422 })
    }

    return new NextResponse("Erreur interne", { status: 500 })
  }
} 