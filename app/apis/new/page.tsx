import { cookies } from "next/headers"
import { ApiForm } from "../components/api-form"
import { redirect } from "next/navigation"

export default async function NewApiPage({ searchParams }: { searchParams: { collectionId?: string } }) {
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value
  const collectionId = searchParams.collectionId

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
          {collectionId && <span> dans la collection sélectionnée</span>}
        </p>
      </div>

      <div className="max-w-2xl">
        <ApiForm 
          api={null} 
          applicationId={activeApplicationId} 
          initialCollectionId={collectionId}
        />
      </div>
    </div>
  )
} 