import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ScheduledTestForm } from "../components/scheduled-test-form"

export default async function EditScheduledTestPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour modifier ce test programmé.
        </div>
      </div>
    )
  }

  const [application, scheduledTest] = await Promise.all([
    prisma.application.findUnique({
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
    }),
    prisma.scheduledTest.findUnique({
      where: { id: params.id },
      include: {
        collections: true,
        environment: true,
        authentication: true
      }
    })
  ])

  if (!application || !scheduledTest) {
    notFound()
  }

  // Vérifier que le test programmé appartient bien à l'application active
  if (scheduledTest.collections.some(col => col.applicationId !== activeApplicationId.value)) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Modifier le test programmé</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {application.name}
          </p>
        </div>
      </div>

      <ScheduledTestForm
        collections={application.collections}
        environments={application.environments}
        authentications={application.authentications}
        initialData={{
          id: scheduledTest.id,
          collectionId: scheduledTest.collections.map(col => col.id),
          environmentId: scheduledTest.environmentId,
          authenticationId: scheduledTest.authenticationId || undefined,
          cronExpression: scheduledTest.cronExpression,
        }}
      />
    </div>
  )
} 