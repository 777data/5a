import { cookies } from "next/headers"
import { CollectionForm } from "../components/collection-form"
import { redirect } from "next/navigation"
import { PageParams } from "@/types/next"

export default async function CollectionPage({ params }: PageParams<{ id: string }>) {
  // Attendre les paramètres de route avant de les utiliser
  const { id: collectionId } = await params
  
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')

  if (!activeApplicationId?.value) {
    return (
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mt-4">
          Veuillez sélectionner une application pour {collectionId === 'new' ? 'créer' : 'modifier'} une collection.
        </div>
      </div>
    )
  }

  if (collectionId === 'new') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Nouvelle collection</h1>
        <CollectionForm applicationId={activeApplicationId.value}/>
      </div>
    )
  }

  // Si ce n'est pas 'new', rediriger vers la vue de la collection
  redirect(`/collections/${collectionId}/view`)
} 