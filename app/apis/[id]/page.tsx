import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApiForm } from "../components/api-form"

export default async function EditApiPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Aucune application sélectionnée</h2>
          <p className="mt-2 text-red-700">
            Veuillez sélectionner une application dans le menu en haut à droite pour modifier une API.
          </p>
        </div>
      </div>
    )
  }

  const api = await prisma.api.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!api || api.applicationId !== activeApplicationId) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modifier l'API</h1>
        <p className="text-sm text-gray-500 mt-1">
          Modifiez les informations de l'API
        </p>
      </div>

      <div className="max-w-2xl">
        <ApiForm api={api} applicationId={activeApplicationId} />
      </div>
    </div>
  )
} 