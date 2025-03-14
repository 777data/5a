import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createEnvironmentSchema = z.object({
  name: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = createEnvironmentSchema.parse(json)

    const environment = await prisma.environment.create({
      data: body,
    })

    return NextResponse.json(environment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    )
  }
} 