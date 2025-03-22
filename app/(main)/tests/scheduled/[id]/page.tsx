import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ScheduledTestForm } from "../components/scheduled-test-form"
import { PageParams } from "@/types/next"

export default async function ScheduledTestPage({ params }: PageParams<{ id: string }>) {
  const { id } = await params
  const isNew = id === 'new'

  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour {isNew ? "créer" : "modifier"} un test programmé.
        </div>
      </div>
    )
  }

  // Récupérer l'application dans tous les cas
  const application = await prisma.application.findUnique({
    where: { id: activeApplicationId.value },
    include: {
      collections: {
        include: {
          application: true
        }
      },
      environments: true,
      authentications: true
    }
  })

  if (!application) {
    notFound()
  }

  // Si ce n'est pas une création, récupérer le test programmé existant
  const scheduledTest = !isNew ? await prisma.scheduledTest.findUnique({
    where: { id },
    include: {
      collections: true,
      environment: true,
      authentication: true
    }
  }) : null

  // Vérifier que le test programmé existe et appartient à l'application active
  if (!isNew) {
    if (!scheduledTest) {
      notFound()
    }

    if (scheduledTest.collections.some(col => col.applicationId !== activeApplicationId.value)) {
      notFound()
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? "Nouveau test programmé" : "Modifier le test programmé"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {application.name}
          </p>
        </div>
      </div>

      <ScheduledTestForm
        collections={application.collections}
        environments={application.environments}
        authentications={application.authentications}
        initialData={!isNew ? {
          id: scheduledTest!.id,
          collectionId: scheduledTest!.collections.map(col => col.id),
          environmentId: scheduledTest!.environmentId,
          authenticationId: scheduledTest!.authenticationId || undefined,
          cronExpression: scheduledTest!.cronExpression,
        } : undefined}
      />
    </div>
  )
} 