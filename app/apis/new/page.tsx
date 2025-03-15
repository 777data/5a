import { cookies } from "next/headers"
import { ApiForm } from "../components/api-form"

export default async function NewApiPage() {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Aucune application sélectionnée</h2>
          <p className="mt-2 text-red-700">
            Veuillez sélectionner une application dans le menu en haut à droite pour créer une API.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouvelle API</h1>
        <p className="text-sm text-gray-500 mt-1">
          Créez une nouvelle API pour votre application
        </p>
      </div>

      <div className="max-w-2xl">
        <ApiForm api={null} applicationId={activeApplicationId} />
      </div>
    </div>
  )
} 