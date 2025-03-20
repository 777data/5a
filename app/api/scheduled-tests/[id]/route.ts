import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cronService } from "@/lib/cron-service"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const activeApplicationId = cookieStore.get('activeApplicationId')

    if (!activeApplicationId?.value) {
      return new NextResponse("Application non sélectionnée", { status: 400 })
    }

    // Vérifier que le test programmé existe et appartient à l'application active
    const scheduledTest = await prisma.scheduledTest.findFirst({
      where: {
        id: params.id,
        application: {
          id: activeApplicationId.value
        }
      }
    })

    if (!scheduledTest) {
      return new NextResponse("Test programmé non trouvé", { status: 404 })
    }

    // Arrêter la tâche CRON
    cronService.stopTask(params.id)

    // Supprimer le test programmé
    await prisma.scheduledTest.delete({
      where: {
        id: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/scheduled-tests/[id]:', error)
    return new NextResponse(null, { status: 500 })
  }
} 