import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ApiForm } from "../components/api-form"
import { PageParams } from "@/types/next"
import { prisma } from "@/lib/prisma"

export default async function NewApiPage(props: PageParams) {
  // Attendre les paramètres avant de les utiliser
  const searchParams = await props.searchParams
  const collectionId = searchParams.collectionId as string | undefined
  
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    redirect('/collections')
  }

  // Vérifier si l'application a au moins une collection
  const collections = await prisma.collection.findMany({
    where: {
      applicationId: activeApplicationId
    }
  })

  if (collections.length === 0) {
    redirect('/collections/new')
  }

  // Si aucune collection n'est spécifiée, utiliser la première collection
  const initialCollectionId = collectionId || collections[0].id

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouvelle API</h1>
        <p className="text-sm text-gray-500 mt-1">
          Créez une nouvelle API dans votre collection
        </p>
      </div>

      <div className="max-w-2xl">
        <ApiForm 
          api={null} 
          applicationId={activeApplicationId} 
          initialCollectionId={initialCollectionId}
        />
      </div>
    </div>
  )
} 