import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateActiveApplicationSchema = z.object({
  applicationId: z.string().min(1),
})

export async function PUT(request: Request) {
  try {
    const json = await request.json()
    const body = updateActiveApplicationSchema.parse(json)

    const cookieStore = cookies()
    await cookieStore.set('activeApplicationId', body.applicationId)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[ACTIVE_APPLICATION_PUT]", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de l'application active" },
      { status: 500 }
    )
  }
} 