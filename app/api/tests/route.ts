import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createTestResultSchema = z.object({
  applicationId: z.string().min(1),
  environmentId: z.string().min(1),
  authenticationId: z.string().optional(),
  duration: z.number().min(0),
  status: z.enum(["SUCCESS", "PARTIAL", "FAILED"]),
  results: z.array(z.object({
    apiId: z.string().min(1),
    statusCode: z.number(),
    duration: z.number().min(0),
    response: z.record(z.any()),
    error: z.string().nullable()
  }))
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = createTestResultSchema.parse(json)

    // Créer le test et ses résultats
    const test = await prisma.apiTest.create({
      data: {
        applicationId: body.applicationId,
        environmentId: body.environmentId,
        authenticationId: body.authenticationId,
        duration: body.duration,
        status: body.status,
        results: {
          create: body.results.map(result => ({
            apiId: result.apiId,
            statusCode: result.statusCode,
            duration: result.duration,
            response: result.response,
            error: result.error
          }))
        }
      },
      include: {
        results: true
      }
    })

    return NextResponse.json(test)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.flatten() },
        { status: 400 }
      )
    }

    console.error('[CREATE_TEST]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement du test" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const tests = await prisma.apiTest.findMany({
      include: {
        environment: true,
        authentication: true,
        results: {
          include: {
            api: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error('[GET_TESTS]', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des tests" },
      { status: 500 }
    )
  }
} 