import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ScheduledTestForm } from "../components/scheduled-test-form"

export default async function NewScheduledTestPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour créer un test programmé.
        </div>
      </div>
    )
  }

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nouveau test programmé</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application : {application.name}
          </p>
        </div>
      </div>

      <ScheduledTestForm
        collections={application.collections}
        environments={application.environments}
        authentications={application.authentications}
      />
    </div>
  )
} 