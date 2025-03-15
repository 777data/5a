import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"

const updateApplicationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
})

type Props = {
  params: {
    id: string
  }
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const json = await request.json()
    const body = updateApplicationSchema.parse(json)

    const application = await prisma.application.update({
      where: {
        id: params.id,
      },
      data: body,
    })

    return NextResponse.json(application)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[APPLICATIONS_PUT]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la modification de l'application" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    await prisma.application.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[APPLICATIONS_DELETE]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de l'application" },
      { status: 500 }
    )
  }
} 