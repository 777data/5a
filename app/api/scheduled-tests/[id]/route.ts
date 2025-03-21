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
})

export async function DELETE(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("scheduled-tests") + 1];

    console.log('DELETE request received for ID:', id)

    const cookieStore = await cookies()
    const activeApplicationId = cookieStore.get('activeApplicationId')

    if (!activeApplicationId?.value) {
      return new NextResponse("Application non sélectionnée", { status: 400 })
    }

    // Vérifier que le test programmé existe et appartient à l'application active
    const existingTest = await prisma.scheduledTest.findFirst({
      where: {
        id: id,
        applicationId: activeApplicationId.value,
      },
    })

    if (!existingTest) {
      return new NextResponse("Test programmé non trouvé", { status: 404 })
    }

    // Arrêter la tâche CRON
    cronService.stopTask(id)

    // Supprimer le test programmé
    await prisma.scheduledTest.delete({
      where: {
        id: id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/scheduled-tests/[id]:', error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // Extraire les paramètres de l'URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf("scheduled-tests") + 1];
    
    const cookieStore = await cookies()
    const activeApplicationId = cookieStore.get('activeApplicationId')

    if (!activeApplicationId?.value) {
      return new NextResponse("Application non sélectionnée", { status: 400 })
    }

    const json = await request.json()
    console.log('Request body:', json)
    
    const body = scheduledTestSchema.parse(json)
    console.log('Parsed body:', body)

    // Vérifier que les collections appartiennent bien à l'application active
    const collections = await prisma.collection.findMany({
      where: {
        id: { in: body.collectionId },
        applicationId: activeApplicationId.value,
      },
    })

    if (collections.length !== body.collectionId.length) {
      return new NextResponse("Collections invalides", { status: 400 })
    }

    // Vérifier que le test programmé existe et appartient à l'application active
    const existingTest = await prisma.scheduledTest.findFirst({
      where: {
        id: id,
        applicationId: activeApplicationId.value,
      },
    })

    if (!existingTest) {
      return new NextResponse("Test programmé non trouvé", { status: 404 })
    }

    console.log('Updating scheduled test with ID:', id)
    const scheduledTest = await prisma.scheduledTest.update({
      where: {
        id: id,
      },
      data: {
        collections: {
          set: body.collectionId.map(id => ({ id })),
        },
        environment: {
          connect: { id: body.environmentId },
        },
        authentication: body.authenticationId
          ? { connect: { id: body.authenticationId } }
          : { disconnect: true },
        cronExpression: body.cronExpression,
      },
      include: {
        collections: true,
        environment: true,
        authentication: true,
      },
    })

    // Mettre à jour la tâche CRON
    console.log('Stopping old CRON task')
    cronService.stopTask(id)
    console.log('Scheduling new CRON task')
    cronService.scheduleTest(scheduledTest)

    return NextResponse.json(scheduledTest)
  } catch (error) {
    console.error('Error in PUT /api/scheduled-tests/[id]:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Une erreur est survenue lors de la modification" }, { status: 500 })
  }
} 