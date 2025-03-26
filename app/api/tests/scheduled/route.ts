import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { cronService } from "@/lib/cron-service"

const scheduledTestSchema = z.object({
  collectionId: z.array(z.string()).min(1, "Au moins une collection est requise"),
  environmentId: z.string().min(1, "L'environnement est requis"),
  authenticationId: z.string().optional(),
  cronExpression: z.string().min(1, "La périodicité est requise"),
  notificationEmails: z.union([z.string(), z.array(z.string())]).transform((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string') return [];
    return val.split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  })
})

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const activeApplicationId = cookieStore.get('activeApplicationId')

    if (!activeApplicationId?.value) {
      return NextResponse.json(
        { error: "Application non sélectionnée" },
        { status: 400 }
      )
    }

    const json = await request.json()
    const body = scheduledTestSchema.parse(json)

    // Vérifier que les collections appartiennent bien à l'application active
    const collections = await prisma.collection.findMany({
      where: {
        id: { in: body.collectionId },
        applicationId: activeApplicationId.value,
      },
    })

    if (collections.length !== body.collectionId.length) {
      return NextResponse.json(
        { error: "Collections invalides" },
        { status: 400 }
      )
    }

    const scheduledTest = await prisma.scheduledTest.create({
      data: {
        application: {
          connect: { id: activeApplicationId.value },
        },
        collections: {
          connect: body.collectionId.map(id => ({ id })),
        },
        environment: {
          connect: { id: body.environmentId },
        },
        authentication: body.authenticationId
          ? { connect: { id: body.authenticationId } }
          : undefined,
        cronExpression: body.cronExpression,
        notificationEmails: body.notificationEmails,
      },
      include: {
        collections: true,
        environment: true,
        authentication: true
      }
    })

    // Programmer la tâche CRON
    cronService.scheduleTest(scheduledTest)

    return NextResponse.json(scheduledTest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/tests/scheduled:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du test programmé" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const scheduledTests = await prisma.scheduledTest.findMany({
      include: {
        collections: {
          include: {
            application: true
          }
        },
        environment: true,
        authentication: true
      }
    })

    return NextResponse.json(scheduledTests)
  } catch (error) {
    console.error("Erreur lors de la récupération des tests programmés:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des tests programmés" },
      { status: 500 }
    )
  }
} 