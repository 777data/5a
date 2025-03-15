import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApisClient } from "./components/apis-client"

export default async function ApisPage() {
  const cookieStore = cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Aucune application sélectionnée</h2>
          <p className="mt-2 text-red-700">
            Veuillez sélectionner une application dans le menu en haut à droite pour voir ses APIs.
          </p>
        </div>
      </div>
    )
  }

  const application = await prisma.application.findUnique({
    where: { id: activeApplicationId },
    include: {
      apis: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      environments: {
        select: {
          id: true,
          name: true,
        },
      },
      authentications: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!application) {
    notFound()
  }

  return (
    <ApisClient
      applicationName={application.name}
      apis={application.apis}
      applicationId={application.id}
      environments={application.environments}
      authentications={application.authentications}
    />
  )
} 