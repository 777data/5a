import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ApiForm } from "../components/api-form"
import { PageParams } from "@/types/next"

export default async function NewApiPage(props: PageParams) {
  // Attendre les paramètres avant de les utiliser
  const searchParams = await props.searchParams
  const collectionId = searchParams.collectionId as string | undefined
  
  const cookieStore = await cookies()
  const activeApplicationId = cookieStore.get('activeApplicationId')?.value

  if (!activeApplicationId) {
    redirect('/collections')
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