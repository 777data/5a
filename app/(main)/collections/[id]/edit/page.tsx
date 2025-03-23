import { prisma } from "@/lib/prisma"
import { CollectionForm } from "../../components/collection-form"
import { notFound, redirect } from "next/navigation"
import { PageParams } from "@/types/next"
import { cookies } from "next/headers"

export default async function EditCollectionPage({ params }: PageParams<{ id: string }>) {
  // Attendre les paramètres de route avant de les utiliser
  const { id: collectionId } = await params
  
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    redirect('/collections')
  }
  
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  })

  if (!collection) {
    return notFound()
  }

  // Vérifier que la collection appartient à l'application active
  if (collection.applicationId !== activeApplicationId) {
    redirect('/collections')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Modifier la collection</h1>
      <CollectionForm collection={collection} applicationId={activeApplicationId} />
    </div>
  )
} 