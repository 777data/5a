import { CollectionForm } from "../components/collection-form"
import { redirect } from "next/navigation"
import { PageParams } from "@/types/next"

export default async function CollectionPage({ params }: PageParams<{ id: string }>) {
  // Attendre les paramètres de route avant de les utiliser
  const { id: collectionId } = await params
  
  if (collectionId === 'new') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Nouvelle collection</h1>
        <CollectionForm />
      </div>
    )
  }

  // Si ce n'est pas 'new', rediriger vers la vue de la collection
  redirect(`/collections/${collectionId}/view`)
} 